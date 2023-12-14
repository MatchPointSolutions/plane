// mq
import { Connection, Channel, connect, ConsumeMessage } from "amqplib";
// utils
import { logger } from "../utils/logger";

export class MQSingleton {
  private static instance: MQSingleton;
  private connection: Connection | null = null;
  public channel: Channel | null = null;

  private constructor() {}

  // Get the current instance
  public static getInstance(): MQSingleton {
    if (!this.instance) {
      this.instance = new MQSingleton();
    }
    return this.instance;
  }

  // Initialize instance
  public async initialize(): Promise<void> {
    if (!this.connection || !this.channel) {
      await this.init();
    }
  }

  private async init(): Promise<void> {
    const rabbitMqUrl = process.env.RABBITMQ_URL || "";
    try {
      this.connection = await connect(rabbitMqUrl);
      logger.info(`✅ Rabbit MQ Connection is ready`);
      this.channel = await this.connection.createChannel();
      logger.info(`🛸 Created RabbitMQ Channel successfully`);
    } catch (error) {
      console.error("Error in initializing RabbitMQ:", error);
    }
  }

  // Send the message to the given queue
  public async sendToQueue(queue: string, content: Buffer): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }
    const exchange = "node_exchange";
    const routingKey = "node.celery";

    const body = {
      args: ["Petr", 30], // args
      kwargs: {}, // kwargs
      other_data: {}, // other data
    };

    const msg = {
      contentType: "application/json",
      contentEncoding: "utf-8",
      headers: {
        id: "3149beef-be66-4b0e-ba47-2fc46e4edac3",
        task: "plane.bgtasks.import_create_task.issue_create_task",
      },
      body: JSON.stringify(body),
    };

    await this.channel.assertExchange(exchange, "direct", { durable: true });
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, routingKey);
    try {
      this.channel.publish(exchange, routingKey, Buffer.from(msg.body), {
        contentType: msg.contentType,
        contentEncoding: msg.contentEncoding,
        headers: msg.headers
      });
    } catch (error) {
      console.error("Error publishing message:", error);
    }
  }

  // Receive the message from the given queue
  public async consume(
    queue: string,
    callback: (msg: ConsumeMessage | null) => void
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }
    logger.info("👂 Listening for incoming events");
    const exchange = "django_exchange";
    const routingKey = "django.node";
    await this.channel.assertExchange(exchange, "direct", { durable: true });
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, routingKey);
    await this.channel.consume(queue, callback, { noAck: true });
  }
}

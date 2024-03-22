import { useContext } from "react";
// mobx store
import { StoreContext } from "@/contexts/store-context";
import { IInbox } from "@/store/inbox_legacy/inbox.store";
// types

export const useInbox = (): IInbox => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInbox must be used within StoreProvider");
  return context.inbox.inbox;
};

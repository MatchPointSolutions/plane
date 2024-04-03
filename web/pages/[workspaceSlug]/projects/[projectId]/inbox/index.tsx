import { ReactElement, useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// components
import { PageHead } from "@/components/core";
import { ProjectInboxHeader } from "@/components/headers";
import { InboxSidebar, InboxIssueRoot } from "@/components/inbox";
import { InboxLayoutLoader } from "@/components/ui";
// hooks
import { useProject, useProjectInbox } from "@/hooks/store";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
// layouts
import { AppLayout } from "@/layouts/app-layout";
// types
import { NextPageWithLayout } from "@/lib/types";

const ProjectInboxPage: NextPageWithLayout = observer(() => {
  // ref
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  /// router
  const router = useRouter();
  const { workspaceSlug, projectId, inboxIssueId } = router.query;
  // store
  const { inboxIssues, inboxIssuesArray, fetchInboxIssues, fetchInboxIssuesNextPage } = useProjectInbox();
  const { currentProjectDetails } = useProject();

  const fetchNextPages = useCallback(() => {
    if (!workspaceSlug || !projectId) return;
    console.log("loading more");
    fetchInboxIssuesNextPage(workspaceSlug.toString(), projectId.toString());
  }, [fetchInboxIssuesNextPage, projectId, workspaceSlug]);
  // page observer
  useIntersectionObserver({
    containerRef,
    elementRef,
    callback: fetchNextPages,
    rootMargin: "20%",
  });
  // return null when workspaceSlug or projectId is not available
  if (!workspaceSlug || !projectId) return null;
  // fetching inbox issues
  useSWR(`PROJECT_INBOX_ISSUES_${projectId}`, () => fetchInboxIssues(workspaceSlug.toString(), projectId.toString()), {
    revalidateOnFocus: false,
  });
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Inbox` : undefined;

  if (!inboxIssues || !currentProjectDetails) {
    return (
      <div className="flex h-full flex-col">
        <InboxLayoutLoader />
      </div>
    );
  }

  // if (!inboxIssueId) {
  //   router.push(`/${workspaceSlug}/projects/${projectId}/inbox?inboxIssueId=${inboxIssues?.[0]?.issue.id}`);
  // }

  return (
    <div className="flex h-full flex-col">
      <PageHead title={pageTitle} />
      <div className="relative flex h-full overflow-hidden">
        <InboxSidebar workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
        <InboxIssueRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          inboxIssuesArray={inboxIssuesArray}
          inboxIssueId={inboxIssueId?.toString()}
        />
      </div>
    </div>
  );
});

ProjectInboxPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectInboxHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectInboxPage;

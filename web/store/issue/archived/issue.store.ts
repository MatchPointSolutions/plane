import pull from "lodash/pull";
import { action, makeObservable, runInAction } from "mobx";
// base class
import { TLoader, ViewFlags, IssuePaginationOptions, TIssuesResponse } from "@plane/types";
// services
// types
import { IIssueRootStore } from "../root.store";
import { IArchivedIssuesFilter } from "./filter.store";
import { BaseIssuesStore, IBaseIssuesStore } from "../helpers/base-issues.store";

export interface IArchivedIssues extends IBaseIssuesStore {
  // observable
  viewFlags: ViewFlags;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    option: IssuePaginationOptions
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (workspaceSlug: string, projectId: string) => Promise<TIssuesResponse | undefined>;

  restoreIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
}

export class ArchivedIssues extends BaseIssuesStore implements IArchivedIssues {
  // filter store
  issueFilterStore: IArchivedIssuesFilter;

  //viewData
  viewFlags = {
    enableQuickAdd: false,
    enableIssueCreation: false,
    enableInlineEditing: true,
  };

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IArchivedIssuesFilter) {
    super(_rootStore, issueFilterStore, true);
    makeObservable(this, {
      // action
      fetchIssues: action,
      restoreIssue: action,
    });
    // filter store
    this.issueFilterStore = issueFilterStore;
  }

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader = "init-loader",
    options: IssuePaginationOptions
  ) => {
    try {
      runInAction(() => {
        this.loader = loadType;
      });
      this.clear();
      const params = this.issueFilterStore?.getFilterParams(options);
      const response = await this.issueArchiveService.getArchivedIssues(workspaceSlug, projectId, params);

      this.onfetchIssues(response, options);
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  fetchNextIssues = async (workspaceSlug: string, projectId: string) => {
    if (!this.paginationOptions) return;
    try {
      this.loader = "pagination";

      const params = this.issueFilterStore?.getFilterParams(this.paginationOptions);
      const response = await this.issueService.getIssues(workspaceSlug, projectId, params);

      this.onfetchNexIssues(response);
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  fetchIssuesWithExistingPagination = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader = "mutation"
  ) => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, projectId, loadType, this.paginationOptions);
  };

  restoreIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueArchiveService.restoreIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.rootIssueStore.issues.updateIssue(issueId, {
          archived_at: null,
        });
        this.issues && pull(this.issues, issueId);
      });

      return response;
    } catch (error) {
      throw error;
    }
  };
}

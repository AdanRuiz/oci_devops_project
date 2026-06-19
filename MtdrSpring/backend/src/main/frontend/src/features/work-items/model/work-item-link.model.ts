export type WorkItemLinkType =
    | 'blocks'
    | 'is_blocked_by'
    | 'relates_to'
    | 'duplicates'
    | 'is_duplicated_by'
    | 'depends_on'
    | 'is_dependency_of';

export interface RelatedWorkItemSummary {
    id: string;
    title: string;
    type: 'feature' | 'issue' | 'bug' | 'task';
    status: string;
    priority: string;
}

export interface WorkItemLink {
    id: string;
    type: WorkItemLinkType;
    fromWorkItem: RelatedWorkItemSummary;
    toWorkItem: RelatedWorkItemSummary;
    createdAt: string;
    createdByUserId: string;
}
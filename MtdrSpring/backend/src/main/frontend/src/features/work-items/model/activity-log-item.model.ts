import type { UserSummary } from '@/shared/models/user-summary.model';

export type ActivityActionType =
    | 'work_item_created'
    | 'work_item_updated'
    | 'status_changed'
    | 'priority_changed'
    | 'assignee_added'
    | 'assignee_removed'
    | 'comment_added'
    | 'comment_updated'
    | 'link_added'
    | 'time_logged'
    | 'work_item_completed';

export interface ActivityContext {
    fieldName?: string;
    oldValue?: string | number | boolean | null;
    newValue?: string | number | boolean | null;
    commentId?: string;
    linkId?: string;
    relatedWorkItemId?: string;
    minutesLogged?: number;
}

export interface ActivityLogItem {
    id: string;
    workItemId: string;
    actor: UserSummary;
    actionType: ActivityActionType;
    occurredAt: string;
    summary: string;
    context: ActivityContext | null;
}
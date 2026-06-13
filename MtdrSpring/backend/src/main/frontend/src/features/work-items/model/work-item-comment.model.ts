import type { UserSummary } from '@/shared/models/user-summary.model';

export interface WorkItemComment {
    id: string;
    workItemId: string;
    author: UserSummary;
    parentCommentId: string | null;
    content: string;
    createdAt: string;
    editedAt: string | null;
    isEdited: boolean;
    replies: WorkItemComment[];
}
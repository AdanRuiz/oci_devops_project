export interface CreateWorkItemCommentDto {
    workItemId: string;
    authorUserId: string;
    content: string;
    parentCommentId?: string | null;
}
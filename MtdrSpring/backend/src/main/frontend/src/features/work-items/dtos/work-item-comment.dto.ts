export interface WorkItemCommentDto {
    commentId: string;
    workItemId: string;
    authorUserId: string;
    authorName: string;
    authorEmail: string | null;
    authorTelegramUserId: string | null;
    parentCommentId: string | null;
    content: string;
    createdAt: string;
    editedAt: string | null;
}
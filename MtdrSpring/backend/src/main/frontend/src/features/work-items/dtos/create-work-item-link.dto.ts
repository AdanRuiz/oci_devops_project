export interface CreateWorkItemLinkDto {
    fromWorkItemId: string;
    toWorkItemId: string;
    type: string;
    createdByUserId: string;
}
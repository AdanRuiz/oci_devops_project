export interface WorkItemLinkDto {
    linkId: string;
    type: string;
    fromWorkItemId: string;
    fromWorkItemTitle: string;
    fromWorkItemType: string;
    fromWorkItemStatus: string;
    fromWorkItemPriority: string;
    toWorkItemId: string;
    toWorkItemTitle: string;
    toWorkItemType: string;
    toWorkItemStatus: string;
    toWorkItemPriority: string;
    createdAt: string;
    createdByUserId: string;
}
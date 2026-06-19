export interface ActivityLogItemDto {
    activityId: string;
    workItemId: string;
    actorUserId: string;
    actorName: string;
    actorEmail: string | null;
    actorTelegramUserId: string | null;
    actionType: string;
    occurredAt: string;
    summary: string;
    contextJson: string | null;
}
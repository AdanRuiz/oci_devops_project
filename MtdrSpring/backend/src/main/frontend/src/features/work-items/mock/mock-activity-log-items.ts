import type { ActivityLogItemDto } from '@/features/work-items/dtos/activity-log-item.dto';

export const mockActivityLogItems: ActivityLogItemDto[] = [
    {
        activityId: 'activity-001',
        workItemId: 'work-item-001',
        actorUserId: 'user-001',
        actorName: 'Bernardo Marin',
        actorEmail: 'bernardo@company.com',
        actorTelegramUserId: 'bernardo_pm',
        actionType: 'status_changed',
        occurredAt: '2026-04-15T08:05:00Z',
        summary: 'Status changed from Todo to In Progress.',
        contextJson: JSON.stringify({
            fieldName: 'status',
            oldValue: 'todo',
            newValue: 'in_progress',
        }),
    },
    {
        activityId: 'activity-002',
        workItemId: 'work-item-001',
        actorUserId: 'user-002',
        actorName: 'Ana Torres',
        actorEmail: 'ana@company.com',
        actorTelegramUserId: 'ana_torres_dev',
        actionType: 'comment_added',
        occurredAt: '2026-04-15T09:10:00Z',
        summary: 'Added a new comment.',
        contextJson: JSON.stringify({
            commentId: 'comment-001',
        }),
    },
    {
        activityId: 'activity-003',
        workItemId: 'work-item-001',
        actorUserId: 'user-001',
        actorName: 'Bernardo Marin',
        actorEmail: 'bernardo@company.com',
        actorTelegramUserId: 'bernardo_pm',
        actionType: 'link_added',
        occurredAt: '2026-04-15T09:25:00Z',
        summary: 'Linked this work item as blocked by another issue.',
        contextJson: JSON.stringify({
            linkId: 'link-001',
            relatedWorkItemId: 'work-item-004',
        }),
    },
];
import type { ActivityLogItemDto } from '@/features/work-items/dtos/activity-log-item.dto';
import type {
    ActivityActionType,
    ActivityContext,
    ActivityLogItem,
} from '@/features/work-items/model/activity-log-item.model';
import { mapUserSummaryFromSource } from '@/shared/mappers/user-summary.mapper';

const ALLOWED_ACTIVITY_ACTION_TYPES: ActivityActionType[] = [
    'work_item_created',
    'work_item_updated',
    'status_changed',
    'priority_changed',
    'assignee_added',
    'assignee_removed',
    'comment_added',
    'comment_updated',
    'link_added',
    'time_logged',
    'work_item_completed',
];

function isActivityActionType(value: string): value is ActivityActionType {
    return ALLOWED_ACTIVITY_ACTION_TYPES.includes(value as ActivityActionType);
}

function parseActivityContext(contextJson: string | null): ActivityContext | null {
    if (!contextJson) {
        return null;
    }

    try {
        const parsed = JSON.parse(contextJson);

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return null;
        }

        return parsed as ActivityContext;
    } catch {
        return null;
    }
}

export function mapActivityLogItemDtoToModel(dto: ActivityLogItemDto): ActivityLogItem {
    if (!isActivityActionType(dto.actionType)) {
        throw new Error(`Unsupported activity action type: ${dto.actionType}`);
    }

    return {
        id: dto.activityId,
        workItemId: dto.workItemId,
        actor: mapUserSummaryFromSource(dto),
        actionType: dto.actionType,
        occurredAt: dto.occurredAt,
        summary: dto.summary,
        context: parseActivityContext(dto.contextJson),
    };
}

export function mapActivityLogItemDtosToModels(dtos: ActivityLogItemDto[]): ActivityLogItem[] {
    return [...dtos]
        .map(mapActivityLogItemDtoToModel)
        .sort((a, b) => {
            return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
        });
}
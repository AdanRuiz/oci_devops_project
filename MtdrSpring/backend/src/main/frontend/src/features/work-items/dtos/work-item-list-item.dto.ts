import type { TagDto } from '../../../shared/dtos/tag.dto';
import type { UserSummaryDto } from '../../../shared/dtos/user-summary.dto';
import type { WorkItemPriority } from '../enums/work-item-priority.enum';
import type { WorkItemStatus } from '../enums/work-item-status.enum';
import type { WorkItemType } from '../enums/work-item-type.enum';

export type WorkItemListItemDto = {
    id: string;
    sprintId?: string;
    title: string;
    type: WorkItemType;
    status: WorkItemStatus;
    priority: WorkItemPriority;
    estimatedMinutes?: number;
    totalLoggedMinutes: number;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: UserSummaryDto;
    assignees: UserSummaryDto[];
    tags: TagDto[];
};
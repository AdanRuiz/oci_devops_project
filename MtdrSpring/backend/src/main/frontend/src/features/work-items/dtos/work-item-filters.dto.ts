import type { WorkItemPriority } from '../enums/work-item-priority.enum';
import type { WorkItemStatus } from '../enums/work-item-status.enum';
import type { WorkItemType } from '../enums/work-item-type.enum';

export type WorkItemFiltersDto = {
    search?: string;
    sprintId?: string;
    assigneeUserId?: string;
    createdByUserId?: string;
    type?: WorkItemType;
    status?: WorkItemStatus;
    priority?: WorkItemPriority;
    tagIds?: string[];
    dueDateFrom?: string;
    dueDateTo?: string;
    page?: number;
    pageSize?: number;
};
import type { TagDto } from '@/shared/dtos/tag.dto';
import type { UserSummaryDto } from '@/shared/dtos/user-summary.dto';
import type { BugSeverity } from '../enums/bug-severity.enum';
import type { AssignmentRole } from '../enums/assignment-role.enum';
import type { WorkItemPriority } from '../enums/work-item-priority.enum';
import type { WorkItemStatus } from '../enums/work-item-status.enum';
import type { WorkItemType } from '../enums/work-item-type.enum';

export type WorkItemDetailDto = {
    id: string;
    sprintId?: string;
    title: string;
    description?: string;
    type: WorkItemType;
    status: WorkItemStatus;
    priority: WorkItemPriority;
    externalLink?: string;
    estimatedMinutes?: number;
    totalLoggedMinutes: number;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    createdBy: UserSummaryDto;
    assignees: Array<Assignee>;
    tags: TagDto[];
    featureDetails?: {
        businessValue?: string;
        acceptanceCriteria?: string;
    };
    issueDetails?: {
        environment?: string;
        reproductionSteps?: string;
    };
    bugDetails?: {
        severity?: BugSeverity;
        environment?: string;
        isReproducible?: boolean;
        steps?: string;
    };
};

export type Assignee = {
    id: string;
    user: UserSummaryDto;
    role: AssignmentRole;
    assignedAt: string;
    unassignedAt?: string;
    assignedByUserId?: string;
}
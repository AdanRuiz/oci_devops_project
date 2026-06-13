import type { TagDto } from '@/shared/dtos/tag.dto';
import type { UserSummaryDto } from '@/shared/dtos/user-summary.dto';
import type { AssignmentRole } from '../enums/assignment-role.enum';
import type { WorkItemPriority } from '../enums/work-item-priority.enum';
import type { WorkItemStatus } from '../enums/work-item-status.enum';
import type { WorkItemType } from '../enums/work-item-type.enum';
import type { FeatureDetails } from "@/features/work-items/model/feature-details.model";
import type { IssueDetails } from "@/features/work-items/model/issue-details.model";
import type { BugDetails } from "@/features/work-items/model/bug-details.model";

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
    assignees: Assignee[];
    tags: TagDto[];
    featureDetails?: FeatureDetails;
    issueDetails?: IssueDetails;
    bugDetails?: BugDetails;
};

export type Assignee = {
    id: string;
    user: UserSummaryDto;
    role: AssignmentRole;
    assignedAt: string;
    unassignedAt?: string;
    assignedByUserId?: string;
}
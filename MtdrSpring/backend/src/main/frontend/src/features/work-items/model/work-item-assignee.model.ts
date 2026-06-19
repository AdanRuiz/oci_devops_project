import type { AssignmentRole } from '../enums/assignment-role.enum';
import type { UserSummary } from '@/shared/models/user-summary.model';

export type WorkItemAssignee = {
    id: string;
    user: UserSummary;
    role: AssignmentRole;
    assignedAt: string;
    unassignedAt?: string;
    assignedByUserId?: string;
};
export const ASSIGNMENT_ROLES = ['OWNER', 'ASSIGNEE', 'REVIEWER'] as const;

export type AssignmentRole = (typeof ASSIGNMENT_ROLES)[number];
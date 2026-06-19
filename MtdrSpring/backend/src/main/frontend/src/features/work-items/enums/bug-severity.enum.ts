export const BUG_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export type BugSeverity = (typeof BUG_SEVERITIES)[number];
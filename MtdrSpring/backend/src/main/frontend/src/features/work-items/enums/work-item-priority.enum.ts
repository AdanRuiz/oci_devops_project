export const WORK_ITEM_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export type WorkItemPriority = (typeof WORK_ITEM_PRIORITIES)[number];
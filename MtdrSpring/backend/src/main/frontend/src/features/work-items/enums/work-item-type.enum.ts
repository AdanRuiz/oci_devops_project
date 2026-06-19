export const WORK_ITEM_TYPES = ['FEATURE', 'ISSUE', 'BUG', 'TASK'] as const;

export type WorkItemType = (typeof WORK_ITEM_TYPES)[number];
export const WORK_ITEM_STATUSES = [
    'TODO',
    'IN_PROGRESS',
    'BLOCKED',
    'DONE'
] as const;

export type WorkItemStatus = (typeof WORK_ITEM_STATUSES)[number];
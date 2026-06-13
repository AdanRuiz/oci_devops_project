export const WORK_ITEM_STATUSES = [
    'TODO',
    'NEW',
    'IN_PROGRESS',
    'BLOCKED',
    'DONE'
] as const;

export type WorkItemStatus = (typeof WORK_ITEM_STATUSES)[number];

/** Backend stores 'NEW'; the UI treats it as 'TODO'. */
export function normalizeStatus(raw: string | null | undefined): WorkItemStatus {
    if (!raw) return 'TODO';
    const upper = raw.toUpperCase();
    if (upper === 'NEW') return 'TODO';
    if (WORK_ITEM_STATUSES.includes(upper as WorkItemStatus)) return upper as WorkItemStatus;
    return 'TODO';
}

/** Convert frontend status back to backend format for API calls. */
export function toBackendStatus(status: WorkItemStatus): string {
    return status === 'TODO' ? 'NEW' : status;
}
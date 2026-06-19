import type { WorkItemPriority } from '../enums/work-item-priority.enum';
import type { WorkItemStatus } from '../enums/work-item-status.enum';
import type { WorkItemType } from '../enums/work-item-type.enum';

export function cx(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(' ');
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export function formatStatusLabel(status: WorkItemStatus): string {
    switch (status) {
        case 'TODO': return 'Todo';
        case 'IN_PROGRESS': return 'In Progress';
        case 'BLOCKED': return 'Blocked';
        case 'DONE': return 'Done';
        default: return status;
    }
}

export function formatTypeLabel(type: WorkItemType): string {
    switch (type) {
        case 'FEATURE': return 'Feature';
        case 'BUG': return 'Bug';
        case 'ISSUE': return 'Issue';
        case 'TASK': return 'Task';
        default: return type;
    }
}

export function formatPriorityLabel(priority: WorkItemPriority): string {
    switch (priority) {
        case 'LOW': return 'Low';
        case 'MEDIUM': return 'Medium';
        case 'HIGH': return 'High';
        case 'CRITICAL': return 'Critical';
        default: return priority;
    }
}

export function getStatusBadgeClasses(status: WorkItemStatus): string {
    switch (status) {
        case 'DONE':
            return 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300';
        case 'BLOCKED':
            return 'border-rose-400/30 bg-rose-500/15 text-rose-300';
        case 'IN_PROGRESS':
            return 'border-sky-400/30 bg-sky-500/15 text-sky-300';
        case 'TODO':
        default:
            return 'border-zinc-400/30 bg-zinc-500/15 text-zinc-400';
    }
}

export function getPriorityBadgeClasses(priority: WorkItemPriority): string {
    switch (priority) {
        case 'CRITICAL':
            return 'border-rose-400/30 bg-rose-500/15 text-rose-300';
        case 'HIGH':
            return 'border-amber-400/30 bg-amber-500/15 text-amber-300';
        case 'MEDIUM':
            return 'border-violet-400/30 bg-violet-500/15 text-violet-300';
        case 'LOW':
        default:
            return 'border-zinc-400/30 bg-zinc-500/15 text-zinc-400';
    }
}

export function getTypeBadgeClasses(type: WorkItemType): string {
    switch (type) {
        case 'FEATURE':
            return 'border-cyan-400/30 bg-cyan-500/15 text-cyan-300';
        case 'BUG':
            return 'border-rose-400/30 bg-rose-500/15 text-rose-300';
        case 'ISSUE':
            return 'border-orange-400/30 bg-orange-500/15 text-orange-300';
        case 'TASK':
        default:
            return 'border-indigo-400/30 bg-indigo-500/15 text-indigo-300';
    }
}

export function getStatusTextColor(status: WorkItemStatus): string {
    switch (status) {
        case 'DONE': return 'text-emerald-300';
        case 'BLOCKED': return 'text-rose-300';
        case 'IN_PROGRESS': return 'text-sky-300';
        case 'TODO': return 'text-zinc-400';
        default: return 'text-zinc-300';
    }
}

export function getStatusDotColor(status: WorkItemStatus): string {
    switch (status) {
        case 'DONE': return 'bg-emerald-400';
        case 'BLOCKED': return 'bg-rose-400';
        case 'IN_PROGRESS': return 'bg-sky-400';
        case 'TODO': return 'bg-zinc-500';
        default: return 'bg-zinc-500';
    }
}

export function calcProgress(logged: number, estimated?: number): number {
    if (!estimated || estimated === 0) return 0;
    return Math.min(100, Math.round((logged / estimated) * 100));
}

export function isOverdue(dueDate?: string, status?: WorkItemStatus): boolean {
    if (!dueDate || status === 'DONE') return false;
    const today = new Date().toISOString().slice(0, 10);
    return dueDate < today;
}

export function formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getSprintLabel(sprintId?: string): string {
    if (!sprintId) return '—';
    const map: Record<string, string> = {
        'spr-001': 'Sprint 1',
        'spr-002': 'Sprint 2',
        'spr-003': 'Sprint 3',
    };
    return map[sprintId] ?? sprintId;
}

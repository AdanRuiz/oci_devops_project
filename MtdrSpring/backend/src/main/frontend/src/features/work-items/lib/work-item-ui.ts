import type {
  Person,
  WorkItemPriority,
  WorkItemStatus,
  WorkItemType,
} from '../types/work-item-ui.types';

export function joinClasses(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function getPersonInitials(person: Person): string {
  return person.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatStatus(status: WorkItemStatus): string {
  return status.replace('_', ' ');
}

export function getTypeClasses(type: WorkItemType): string {
  switch (type) {
    case 'feature':
      return 'border-cyan-400/30 bg-cyan-500/15 text-cyan-300';
    case 'bug':
      return 'border-rose-400/30 bg-rose-500/15 text-rose-300';
    case 'issue':
      return 'border-orange-400/30 bg-orange-500/15 text-orange-300';
    case 'task':
    default:
      return 'border-indigo-400/30 bg-indigo-500/15 text-indigo-300';
  }
}

export function getStatusClasses(status: WorkItemStatus): string {
  switch (status) {
    case 'done':
      return 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300';
    case 'blocked':
      return 'border-rose-400/30 bg-rose-500/15 text-rose-300';
    case 'in_progress':
      return 'border-sky-400/30 bg-sky-500/15 text-sky-300';
    case 'todo':
    default:
      return 'border-zinc-400/30 bg-zinc-500/15 text-zinc-300';
  }
}

export function getPriorityClasses(priority: WorkItemPriority): string {
  switch (priority) {
    case 'critical':
      return 'border-rose-400/30 bg-rose-500/15 text-rose-300';
    case 'high':
      return 'border-amber-400/30 bg-amber-500/15 text-amber-300';
    case 'medium':
      return 'border-violet-400/30 bg-violet-500/15 text-violet-300';
    case 'low':
    default:
      return 'border-zinc-400/30 bg-zinc-500/15 text-zinc-300';
  }
}
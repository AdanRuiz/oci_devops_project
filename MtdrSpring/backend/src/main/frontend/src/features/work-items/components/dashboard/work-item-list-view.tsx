import React from 'react';
import { CheckCircle2, Pencil, Eye } from 'lucide-react';
import type { WorkItemDetailDto } from '../../dtos/work-item-detail.dto';
import {
    formatStatusLabel,
    formatTypeLabel,
    formatPriorityLabel,
    getStatusBadgeClasses,
    getPriorityBadgeClasses,
    getTypeBadgeClasses,
    calcProgress,
    isOverdue,
    formatDate,
    getSprintLabel,
    getInitials,
    cx,
} from '../../lib/dashboard-ui';

interface WorkItemListViewProps {
    items: WorkItemDetailDto[];
    onEdit: (item: WorkItemDetailDto) => void;
    onComplete: (item: WorkItemDetailDto) => void;
    onViewDetail: (item: WorkItemDetailDto) => void;
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span
            className={cx(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                className,
            )}
        >
            {children}
        </span>
    );
}

function AvatarStack({ names }: { names: string[] }) {
    if (names.length === 0) {
        return <span className="text-xs text-zinc-500">Unassigned</span>;
    }
    return (
        <div className="flex -space-x-2">
            {names.slice(0, 3).map((name, i) => (
                <div
                    key={i}
                    title={name}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-900 bg-zinc-700 text-[10px] font-semibold text-zinc-200"
                >
                    {getInitials(name)}
                </div>
            ))}
            {names.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-900 bg-zinc-700 text-[10px] font-semibold text-zinc-400">
                    +{names.length - 3}
                </div>
            )}
        </div>
    );
}

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-700">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                    style={{ width: `${value}%` }}
                />
            </div>
            <span className="text-xs tabular-nums text-zinc-400">{value}%</span>
        </div>
    );
}

export function WorkItemListView({ items, onEdit, onComplete, onViewDetail }: WorkItemListViewProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 py-16 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-zinc-600" />
                <p className="text-base font-medium text-zinc-400">No tasks found</p>
                <p className="mt-1 text-sm text-zinc-600">Try adjusting your filters or create a new task.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
            {/* Table header */}
            <div className="hidden grid-cols-[minmax(0,3fr)_100px_110px_90px_90px_100px_80px_90px_80px] gap-4 border-b border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:grid">
                <span>Title</span>
                <span>Type</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Assignees</span>
                <span>Due Date</span>
                <span>Sprint</span>
                <span>Progress</span>
                <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-zinc-800/80">
                {items.map((item) => {
                    const progress = calcProgress(item.totalLoggedMinutes, item.estimatedMinutes);
                    const overdue = isOverdue(item.dueDate, item.status);
                    const assigneeNames = item.assignees.map((a) => a.user.name);
                    const isDone = item.status === 'DONE';

                    return (
                        <div
                            key={item.id}
                            className="group flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/40 lg:grid lg:grid-cols-[minmax(0,3fr)_100px_110px_90px_90px_100px_80px_90px_80px] lg:items-center lg:gap-4"
                        >
                            {/* Title */}
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <button
                                    type="button"
                                    onClick={() => onViewDetail(item)}
                                    className={cx(
                                        'truncate text-left text-sm font-medium hover:text-sky-300 transition-colors',
                                        isDone ? 'text-zinc-500 line-through' : 'text-zinc-100',
                                    )}
                                    title={item.title}
                                >
                                    {item.title}
                                </button>
                                <span className="text-xs text-zinc-600">{item.id}</span>
                            </div>

                            {/* Type */}
                            <Pill className={getTypeBadgeClasses(item.type)}>
                                {formatTypeLabel(item.type)}
                            </Pill>

                            {/* Status */}
                            <Pill className={getStatusBadgeClasses(item.status)}>
                                {formatStatusLabel(item.status)}
                            </Pill>

                            {/* Priority */}
                            <Pill className={getPriorityBadgeClasses(item.priority)}>
                                {formatPriorityLabel(item.priority)}
                            </Pill>

                            {/* Assignees */}
                            <AvatarStack names={assigneeNames} />

                            {/* Due Date */}
                            <span
                                className={cx(
                                    'text-xs',
                                    overdue ? 'font-medium text-rose-400' : 'text-zinc-400',
                                )}
                            >
                                {formatDate(item.dueDate)}
                            </span>

                            {/* Sprint */}
                            <span className="text-xs text-zinc-500">
                                {getSprintLabel(item.sprintId)}
                            </span>

                            {/* Progress */}
                            <ProgressBar value={progress} />

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-1">
                                <button
                                    type="button"
                                    onClick={() => onViewDetail(item)}
                                    title="View detail"
                                    className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onEdit(item)}
                                    title="Edit task"
                                    className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                                {!isDone && (
                                    <button
                                        type="button"
                                        onClick={() => onComplete(item)}
                                        title="Mark as done"
                                        className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-emerald-500/20 hover:text-emerald-400"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

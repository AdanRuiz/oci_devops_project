import React from 'react';
import { CheckCircle2, Pencil, Eye } from 'lucide-react';
import type { WorkItemDetailDto } from '../../dtos/work-item-detail.dto';
import type { WorkItemStatus } from '../../enums/work-item-status.enum';
import {
    formatStatusLabel,
    formatTypeLabel,
    formatPriorityLabel,
    getPriorityBadgeClasses,
    getTypeBadgeClasses,
    getStatusDotColor,
    getStatusTextColor,
    calcProgress,
    isOverdue,
    formatDate,
    getInitials,
    cx,
} from '../../lib/dashboard-ui';

interface KanbanViewProps {
    items: WorkItemDetailDto[];
    onEdit: (item: WorkItemDetailDto) => void;
    onComplete: (item: WorkItemDetailDto) => void;
    onViewDetail: (item: WorkItemDetailDto) => void;
}

const COLUMNS: { status: WorkItemStatus; label: string }[] = [
    { status: 'TODO', label: 'Todo' },
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'BLOCKED', label: 'Blocked' },
    { status: 'DONE', label: 'Done' },
];

function KanbanCard({
    item,
    onEdit,
    onComplete,
    onViewDetail,
}: {
    item: WorkItemDetailDto;
    onEdit: (item: WorkItemDetailDto) => void;
    onComplete: (item: WorkItemDetailDto) => void;
    onViewDetail: (item: WorkItemDetailDto) => void;
}) {
    const progress = calcProgress(item.totalLoggedMinutes, item.estimatedMinutes);
    const overdue = isOverdue(item.dueDate, item.status);
    const isDone = item.status === 'DONE';

    return (
        <div className="group rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20">
            {/* Type + Priority badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <span
                    className={cx(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                        getTypeBadgeClasses(item.type),
                    )}
                >
                    {formatTypeLabel(item.type)}
                </span>
                <span
                    className={cx(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                        getPriorityBadgeClasses(item.priority),
                    )}
                >
                    {formatPriorityLabel(item.priority)}
                </span>
            </div>

            {/* Title */}
            <button
                type="button"
                onClick={() => onViewDetail(item)}
                className={cx(
                    'mt-2 block w-full text-left text-sm font-medium leading-snug transition-colors hover:text-sky-300',
                    isDone ? 'text-zinc-500 line-through' : 'text-zinc-100',
                )}
            >
                {item.title}
            </button>

            {/* Due date */}
            {item.dueDate && (
                <p className={cx('mt-1.5 text-xs', overdue ? 'text-rose-400' : 'text-zinc-500')}>
                    Due {formatDate(item.dueDate)}
                </p>
            )}

            {/* Progress bar */}
            {item.estimatedMinutes && item.estimatedMinutes > 0 && (
                <div className="mt-2.5">
                    <div className="h-1 overflow-hidden rounded-full bg-zinc-700/60">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Footer: assignees + actions */}
            <div className="mt-3 flex items-center justify-between">
                <div className="flex -space-x-1.5">
                    {item.assignees.length === 0 && (
                        <span className="text-xs text-zinc-600">Unassigned</span>
                    )}
                    {item.assignees.slice(0, 3).map((a, i) => (
                        <div
                            key={i}
                            title={a.user.name}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-900 bg-zinc-700 text-[10px] font-semibold text-zinc-200"
                        >
                            {getInitials(a.user.name)}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                        type="button"
                        onClick={() => onViewDetail(item)}
                        title="View detail"
                        className="rounded-md p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Edit"
                        className="rounded-md p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {!isDone && (
                        <button
                            type="button"
                            onClick={() => onComplete(item)}
                            title="Mark done"
                            className="rounded-md p-1 text-zinc-500 hover:bg-emerald-500/20 hover:text-emerald-400"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function KanbanView({ items, onEdit, onComplete, onViewDetail }: KanbanViewProps) {
    return (
        <div className="grid min-h-[400px] grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map(({ status, label }) => {
                const colItems = items.filter((i) => i.status === status);
                return (
                    <div key={status} className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/30">
                        {/* Column header */}
                        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2.5">
                            <span className={cx('h-2.5 w-2.5 rounded-full', getStatusDotColor(status))} />
                            <span className={cx('text-sm font-semibold', getStatusTextColor(status))}>
                                {formatStatusLabel(status)}
                            </span>
                            <span className="ml-auto rounded-full bg-zinc-700/60 px-2 py-0.5 text-xs font-semibold text-zinc-400">
                                {colItems.length}
                            </span>
                        </div>

                        {/* Cards */}
                        <div className="flex flex-1 flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-320px)]">
                            {colItems.length === 0 && (
                                <div className="flex flex-1 items-center justify-center py-8">
                                    <p className="text-xs text-zinc-600">No items</p>
                                </div>
                            )}
                            {colItems.map((item) => (
                                <KanbanCard
                                    key={item.id}
                                    item={item}
                                    onEdit={onEdit}
                                    onComplete={onComplete}
                                    onViewDetail={onViewDetail}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

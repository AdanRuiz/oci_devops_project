import React from 'react';
import { X, Calendar, Flag, Clock, Tag, Users, CheckCircle2 } from 'lucide-react';
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

interface WorkItemDetailModalProps {
    isOpen: boolean;
    item: WorkItemDetailDto | null;
    onClose: () => void;
    onEdit: (item: WorkItemDetailDto) => void;
    onComplete: (item: WorkItemDetailDto) => void;
}

function DetailRow({ icon, label, children }: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 text-zinc-500">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
                <div className="mt-0.5">{children}</div>
            </div>
        </div>
    );
}

export function WorkItemDetailModal({
    isOpen,
    item,
    onClose,
    onEdit,
    onComplete,
}: WorkItemDetailModalProps) {
    if (!isOpen || !item) return null;

    const progress = calcProgress(item.totalLoggedMinutes, item.estimatedMinutes);
    const overdue = isOverdue(item.dueDate, item.status);
    const isDone = item.status === 'DONE';

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Task detail"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
                {/* Header */}
                <div className="border-b border-zinc-800 px-6 py-4">
                    <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-1.5">
                                <span
                                    className={cx(
                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                                        getTypeBadgeClasses(item.type),
                                    )}
                                >
                                    {formatTypeLabel(item.type)}
                                </span>
                                <span
                                    className={cx(
                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                                        getStatusBadgeClasses(item.status),
                                    )}
                                >
                                    {formatStatusLabel(item.status)}
                                </span>
                                <span
                                    className={cx(
                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                                        getPriorityBadgeClasses(item.priority),
                                    )}
                                >
                                    {formatPriorityLabel(item.priority)}
                                </span>
                            </div>
                            <h2 className="mt-2 text-base font-semibold leading-snug text-zinc-100">
                                {item.title}
                            </h2>
                            <p className="mt-0.5 text-xs text-zinc-600">{item.id}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="max-h-[70vh] overflow-y-auto p-6">
                    <div className="grid gap-5">
                        {/* Description */}
                        {item.description && (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Description</p>
                                <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                                    {item.description}
                                </p>
                            </div>
                        )}

                        {/* Meta grid */}
                        <div className="grid gap-4 border-t border-zinc-800 pt-4 sm:grid-cols-2">
                            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Due Date">
                                <span
                                    className={cx(
                                        'text-sm',
                                        overdue ? 'font-medium text-rose-400' : 'text-zinc-300',
                                    )}
                                >
                                    {formatDate(item.dueDate)}
                                    {overdue && ' · Overdue'}
                                </span>
                            </DetailRow>

                            <DetailRow icon={<Flag className="h-4 w-4" />} label="Sprint">
                                <span className="text-sm text-zinc-300">{getSprintLabel(item.sprintId)}</span>
                            </DetailRow>

                            <DetailRow icon={<Clock className="h-4 w-4" />} label="Time">
                                <span className="text-sm text-zinc-300">
                                    {item.totalLoggedMinutes}
                                    {item.estimatedMinutes ? `/${item.estimatedMinutes}` : ''} min
                                </span>
                            </DetailRow>

                            <DetailRow icon={<CheckCircle2 className="h-4 w-4" />} label="Progress">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-700">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-zinc-300">{progress}%</span>
                                </div>
                            </DetailRow>
                        </div>

                        {/* Assignees */}
                        <DetailRow icon={<Users className="h-4 w-4" />} label="Assignees">
                            {item.assignees.length === 0 ? (
                                <span className="text-sm text-zinc-500">Unassigned</span>
                            ) : (
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {item.assignees.map((a) => (
                                        <div
                                            key={a.id}
                                            className="flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-1.5"
                                        >
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-semibold text-zinc-200">
                                                {getInitials(a.user.name)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-zinc-200">{a.user.name}</p>
                                                <p className="text-[10px] text-zinc-500">{a.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </DetailRow>

                        {/* Tags */}
                        {item.tags.length > 0 && (
                            <DetailRow icon={<Tag className="h-4 w-4" />} label="Tags">
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {item.tags.map((tag) => (
                                        <span
                                            key={tag.id}
                                            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
                                            style={{ borderColor: `${tag.color}40`, color: tag.color }}
                                        >
                                            #{tag.name}
                                        </span>
                                    ))}
                                </div>
                            </DetailRow>
                        )}

                        {/* Comments placeholder */}
                        <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Activity</p>
                            <p className="mt-2 text-sm text-zinc-600">
                                Comments and activity history will appear here once connected to the backend.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
                    <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                    >
                        Edit
                    </button>
                    {!isDone && (
                        <button
                            type="button"
                            onClick={() => onComplete(item)}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
                        >
                            Mark as Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

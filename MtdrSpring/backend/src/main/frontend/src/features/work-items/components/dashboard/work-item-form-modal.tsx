import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { WorkItemDetailDto } from '../../dtos/work-item-detail.dto';
import type { CreateWorkItemDto } from '../../dtos/create-work-item.dto';
import type { UpdateWorkItemDto } from '../../dtos/update-work-item.dto';
import type { WorkItemType } from '../../enums/work-item-type.enum';
import type { WorkItemStatus } from '../../enums/work-item-status.enum';
import type { WorkItemPriority } from '../../enums/work-item-priority.enum';
import type { UserSummaryDto } from '@/shared/dtos/user-summary.dto';
import type { TagDto } from '@/shared/dtos/tag.dto';
import { WORK_ITEM_TYPES } from '../../enums/work-item-type.enum';
import { WORK_ITEM_STATUSES } from '../../enums/work-item-status.enum';
import { WORK_ITEM_PRIORITIES } from '../../enums/work-item-priority.enum';
import {
    formatTypeLabel,
    formatStatusLabel,
    formatPriorityLabel,
} from '../../lib/dashboard-ui';

interface WorkItemFormModalProps {
    isOpen: boolean;
    item?: WorkItemDetailDto | null;
    users: UserSummaryDto[];
    tags: TagDto[];
    onClose: () => void;
    onCreate: (dto: CreateWorkItemDto) => Promise<void>;
    onUpdate: (id: string, dto: UpdateWorkItemDto) => Promise<void>;
}

interface FormState {
    title: string;
    description: string;
    type: WorkItemType;
    status: WorkItemStatus;
    priority: WorkItemPriority;
    dueDate: string;
    estimatedMinutes: string;
    sprintId: string;
    assigneeUserIds: string[];
    tagIds: string[];
}

const DEFAULT_FORM: FormState = {
    title: '',
    description: '',
    type: 'TASK',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
    estimatedMinutes: '',
    sprintId: '',
    assigneeUserIds: [],
    tagIds: [],
};

const SPRINT_OPTIONS = [
    { id: '', label: 'No Sprint' },
    { id: 'spr-001', label: 'Sprint 1' },
    { id: 'spr-002', label: 'Sprint 2' },
    { id: 'spr-003', label: 'Sprint 3' },
];

function Label({ children }: { children: React.ReactNode }) {
    return <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">{children}</label>;
}

function Input({ value, onChange, placeholder, type = 'text' }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30"
        />
    );
}

function Select({ value, onChange, children }: {
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30"
        >
            {children}
        </select>
    );
}

export function WorkItemFormModal({
    isOpen,
    item,
    users,
    tags,
    onClose,
    onCreate,
    onUpdate,
}: WorkItemFormModalProps) {
    const isEditing = !!item;
    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        if (item) {
            setForm({
                title: item.title,
                description: item.description ?? '',
                type: item.type,
                status: item.status,
                priority: item.priority,
                dueDate: item.dueDate ?? '',
                estimatedMinutes: item.estimatedMinutes?.toString() ?? '',
                sprintId: item.sprintId ?? '',
                assigneeUserIds: item.assignees.map((a) => a.user.id),
                tagIds: item.tags.map((t) => t.id),
            });
        } else {
            setForm(DEFAULT_FORM);
        }
        setError('');
    }, [isOpen, item]);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function toggleArrayItem(key: 'assigneeUserIds' | 'tagIds', id: string) {
        setForm((prev) => {
            const arr = prev[key] as string[];
            return {
                ...prev,
                [key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id],
            };
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim()) {
            setError('Title is required.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const minutes = form.estimatedMinutes ? parseInt(form.estimatedMinutes, 10) : undefined;
            if (isEditing && item) {
                const dto: UpdateWorkItemDto = {
                    title: form.title.trim(),
                    description: form.description.trim() || undefined,
                    status: form.status,
                    priority: form.priority,
                    dueDate: form.dueDate || undefined,
                    estimatedMinutes: minutes,
                    assigneeUserIds: form.assigneeUserIds,
                    tagIds: form.tagIds,
                };
                await onUpdate(item.id, dto);
            } else {
                const dto: CreateWorkItemDto = {
                    title: form.title.trim(),
                    description: form.description.trim() || undefined,
                    type: form.type,
                    status: form.status,
                    priority: form.priority,
                    dueDate: form.dueDate || undefined,
                    estimatedMinutes: minutes,
                    sprintId: form.sprintId || undefined,
                    assigneeUserIds: form.assigneeUserIds,
                    tagIds: form.tagIds,
                };
                await onCreate(dto);
            }
            onClose();
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={isEditing ? 'Edit task' : 'Create task'}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                    <h2 className="text-base font-semibold text-zinc-100">
                        {isEditing ? 'Edit Task' : 'New Task'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6">
                    {error && (
                        <p className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-sm text-rose-400">
                            {error}
                        </p>
                    )}

                    <div className="grid gap-4">
                        {/* Title */}
                        <div>
                            <Label>Title *</Label>
                            <Input
                                value={form.title}
                                onChange={(v) => set('title', v)}
                                placeholder="Task title…"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label>Description</Label>
                            <textarea
                                value={form.description}
                                onChange={(e) => set('description', e.target.value)}
                                placeholder="Describe the task…"
                                rows={3}
                                className="w-full resize-none rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30"
                            />
                        </div>

                        {/* Type / Status / Priority row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label>Type</Label>
                                <Select value={form.type} onChange={(v) => set('type', v as WorkItemType)}>
                                    {WORK_ITEM_TYPES.map((t) => (
                                        <option key={t} value={t}>{formatTypeLabel(t)}</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select value={form.status} onChange={(v) => set('status', v as WorkItemStatus)}>
                                    {WORK_ITEM_STATUSES.map((s) => (
                                        <option key={s} value={s}>{formatStatusLabel(s)}</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label>Priority</Label>
                                <Select value={form.priority} onChange={(v) => set('priority', v as WorkItemPriority)}>
                                    {WORK_ITEM_PRIORITIES.map((p) => (
                                        <option key={p} value={p}>{formatPriorityLabel(p)}</option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Due Date / Estimated Minutes / Sprint */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={(v) => set('dueDate', v)}
                                />
                            </div>
                            <div>
                                <Label>Estimated (min)</Label>
                                <Input
                                    type="number"
                                    value={form.estimatedMinutes}
                                    onChange={(v) => set('estimatedMinutes', v)}
                                    placeholder="e.g. 120"
                                />
                            </div>
                            <div>
                                <Label>Sprint</Label>
                                <Select value={form.sprintId} onChange={(v) => set('sprintId', v)}>
                                    {SPRINT_OPTIONS.map((s) => (
                                        <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Assignees */}
                        <div>
                            <Label>Assignees</Label>
                            <div className="flex flex-wrap gap-2">
                                {users.map((u) => {
                                    const selected = form.assigneeUserIds.includes(u.id);
                                    return (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => toggleArrayItem('assigneeUserIds', u.id)}
                                            className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                                                selected
                                                    ? 'border-sky-500/50 bg-sky-500/15 text-sky-300'
                                                    : 'border-zinc-700/60 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                                            }`}
                                        >
                                            {u.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => {
                                    const selected = form.tagIds.includes(tag.id);
                                    return (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => toggleArrayItem('tagIds', tag.id)}
                                            className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                                                selected
                                                    ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                                                    : 'border-zinc-700/60 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                                            }`}
                                        >
                                            #{tag.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-400 disabled:opacity-50"
                        >
                            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

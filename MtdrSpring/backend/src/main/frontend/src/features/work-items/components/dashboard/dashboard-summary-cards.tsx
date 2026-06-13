import React from 'react';
import { CheckSquare, Clock, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { WorkItemDetailDto } from '../../dtos/work-item-detail.dto';
import { isOverdue } from '../../lib/dashboard-ui';

interface SummaryCardsProps {
    items: WorkItemDetailDto[];
}

interface StatCard {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
}

export function DashboardSummaryCards({ items }: SummaryCardsProps) {
    const total = items.length;
    const todo = items.filter((i) => i.status === 'TODO').length;
    const inProgress = items.filter((i) => i.status === 'IN_PROGRESS').length;
    const blocked = items.filter((i) => i.status === 'BLOCKED').length;
    const done = items.filter((i) => i.status === 'DONE').length;
    const overdue = items.filter((i) => isOverdue(i.dueDate, i.status)).length;

    const cards: StatCard[] = [
        {
            label: 'Total Tasks',
            value: total,
            icon: <CheckSquare className="h-5 w-5" />,
            color: 'text-zinc-300',
            bg: 'bg-zinc-800/60',
            border: 'border-zinc-700/50',
        },
        {
            label: 'Todo',
            value: todo,
            icon: <Clock className="h-5 w-5" />,
            color: 'text-zinc-400',
            bg: 'bg-zinc-800/60',
            border: 'border-zinc-700/50',
        },
        {
            label: 'In Progress',
            value: inProgress,
            icon: <AlertCircle className="h-5 w-5 text-sky-400" />,
            color: 'text-sky-300',
            bg: 'bg-sky-500/10',
            border: 'border-sky-500/20',
        },
        {
            label: 'Blocked',
            value: blocked,
            icon: <AlertTriangle className="h-5 w-5 text-rose-400" />,
            color: 'text-rose-300',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
        },
        {
            label: 'Done',
            value: done,
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
            color: 'text-emerald-300',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
        },
        {
            label: 'Overdue',
            value: overdue,
            icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
            color: 'text-amber-300',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className={`flex flex-col gap-2 rounded-2xl border p-4 ${card.bg} ${card.border}`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`${card.color} opacity-70`}>{card.icon}</span>
                        <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-400">{card.label}</p>
                </div>
            ))}
        </div>
    );
}

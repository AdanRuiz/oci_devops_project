import type {
  WorkItemPriority,
  WorkItemStatus,
  WorkItemType,
} from '../../types/work-item-ui.types';
import {
  formatStatus,
  getPriorityClasses,
  getStatusClasses,
  getTypeClasses,
  joinClasses,
} from '../../lib/work-item-ui';
import React from "react";

interface WorkItemBadgeRowProps {
  id: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: WorkItemPriority;
}

function Pill({children, className}: { children: React.ReactNode; className?: string; }) {
  return (
    <span
      className={joinClasses(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function WorkItemBadgeRow({id, type, status, priority,}: WorkItemBadgeRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pill className={getTypeClasses(type)}>{type}</Pill>
      <Pill className={getStatusClasses(status)}>{formatStatus(status)}</Pill>
      <Pill className={getPriorityClasses(priority)}>{priority} priority</Pill>
      <Pill className="border-white/10 bg-white/5 text-zinc-300">{id}</Pill>
    </div>
  );
}
import moment from 'moment';
import { Bug, CheckCircle2, Pencil, Trash2 } from 'lucide-react';

export default function DevTaskRow({
  item,
  highlighted,
  isCompleted,
  formatStatusLabel,
  priorityPillClass,
  pendingDeleteId,
  onAdvance,
  onReopen,
  onEdit,
  onDeleteRequest,
  onConfirmDelete,
  onCancelDelete,
  animationDelay = 0,
}) {
  const isConfirming = pendingDeleteId === item.id;
  const status = String(item.status || '').toUpperCase();
  const advanceLabel =
    status === 'PENDING' ? 'Start' : status === 'IN_PROGRESS' ? 'Finish' : 'Advance';
  const isFinishAction = status === 'IN_PROGRESS';

  if (isCompleted) {
    return (
      <div
        className={`dashboard-row-enter flex items-start gap-3 border-b border-[#2A1814]/[0.08] px-1 py-3.5 transition-colors hover:bg-[#2A1814]/[0.015] last:border-b-0 ${
          highlighted ? 'ring-2 ring-[#c74634]/25 ring-offset-2 ring-offset-[#faf9f6]' : ''
        }`}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c74634]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-[#6B6560] line-through">{item.title}</p>
          <p className="mt-1 text-xs text-[#6B6560]">
            Completed {item.updatedAt ? moment(item.updatedAt).fromNow() : 'recently'}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onReopen(item)}
            className="rounded-full border border-[#2A1814]/15 px-3 py-1.5 text-xs font-medium text-[#2A1814] transition hover:bg-[#faf9f6]"
          >
            Reopen
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-full p-2 text-[#6B6560] transition hover:bg-[#faf9f6] hover:text-[#2A1814]"
            aria-label="Edit task"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`dashboard-row-enter flex flex-col gap-3 border-b border-[#2A1814]/[0.08] px-1 py-3.5 sm:flex-row sm:items-center sm:justify-between last:border-b-0 ${
        highlighted ? 'ring-2 ring-[#c74634]/25 ring-offset-2 ring-offset-[#faf9f6]' : ''
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#2A1814]">{item.title}</p>
        <p className="mt-1 truncate text-xs text-[#6B6560]">
          {item.description || 'No description'} · {formatStatusLabel(item.status)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {item.isBug && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#c74634]/10 px-2 py-0.5 font-medium text-[#c74634]">
              <Bug className="h-3 w-3" />
              Bug
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 font-medium ${priorityPillClass(item.priority)}`}>
            {item.priority || 'N/A'}
          </span>
          <span className="text-[#6B6560]">Estimate: {item.expectedHours || 0}h</span>
        </div>
      </div>

      {isConfirming ? (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <span className="text-xs text-[#6B6560]">Delete this task?</span>
          <button
            type="button"
            onClick={() => onConfirmDelete(item.id)}
            className="rounded-full bg-[#c74634] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#b33d2c]"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={onCancelDelete}
            className="rounded-full border border-[#2A1814]/15 px-3 py-1.5 text-xs font-medium text-[#2A1814] transition hover:bg-[#faf9f6]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {status !== 'DONE' && (
            <button
              type="button"
              onClick={() => onAdvance(item)}
              className={
                isFinishAction
                  ? 'inline-flex items-center gap-1 rounded-full bg-[#2A1814] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1d110e]'
                  : 'rounded-full border border-[#2A1814]/15 px-3 py-1.5 text-xs font-medium text-[#2A1814] transition hover:bg-[#faf9f6]'
              }
            >
              {isFinishAction && <CheckCircle2 className="h-3.5 w-3.5" />}
              {advanceLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-full p-2 text-[#6B6560] transition hover:bg-[#faf9f6] hover:text-[#2A1814]"
            aria-label="Edit task"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteRequest(item.id)}
            className="rounded-full p-2 text-[#6B6560] transition hover:bg-[#fff6f4] hover:text-[#c74634]"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

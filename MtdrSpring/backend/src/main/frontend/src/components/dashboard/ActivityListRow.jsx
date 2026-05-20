function ActivityListRow({ item, isLast, showBy = true, showTime = true, rowIndex = 0 }) {
  const layoutClass =
    showBy || showTime ? 'grid grid-cols-[minmax(0,1fr)_150px_170px] gap-3' : 'flex flex-col gap-1';
  const alignmentClass = showBy || showTime ? 'items-center' : 'items-start';

  return (
    <article
      className={`${layoutClass} ${alignmentClass} py-4 transition-colors hover:bg-[#2A1814]/[0.02] ${
        isLast ? '' : 'border-b border-[#2A1814]/[0.06]'
      } dashboard-row-enter`}
      style={{ animationDelay: `${Math.min(rowIndex * 22, 200)}ms` }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#2A1814]">{item.title}</p>
        <p className="truncate text-xs text-[#6B6560]">{item.detail}</p>
      </div>
      {showBy && <span className="truncate text-xs text-[#6B6560]">{item.by || 'Team member'}</span>}
      {showTime && <span className="shrink-0 text-right text-xs text-[#6B6560]">{item.time || '—'}</span>}
    </article>
  );
}

export default ActivityListRow;

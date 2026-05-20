import { ArrowRight } from 'lucide-react';

function ActivityListRow({ item, isLast }) {
  return (
    <article
      className={`group flex gap-3 py-4 transition-colors hover:bg-[#2A1814]/[0.02] ${
        isLast ? '' : 'border-b border-[#2A1814]/[0.06]'
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2A1814]/[0.05] text-xs font-semibold text-[#c74634]">
        {item.title.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#2A1814]">{item.title}</p>
        <p className="truncate text-xs text-[#6B6560]">{item.detail}</p>
      </div>
      <span className="shrink-0 self-center text-xs text-[#6B6560]">{item.time}</span>
      <button
        type="button"
        className="hidden shrink-0 self-center text-[#6B6560] opacity-0 transition group-hover:opacity-100 hover:text-[#c74634] sm:inline-flex"
        aria-label={`View ${item.title}`}
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </article>
  );
}

export default ActivityListRow;

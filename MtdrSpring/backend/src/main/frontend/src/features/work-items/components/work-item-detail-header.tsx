import { CalendarDays, ExternalLink, Flag, UserRound } from 'lucide-react';
import type { WorkItemDetail } from '../types/work-item-ui.types';
import { WorkItemBadgeRow } from './shared/work-item-badge-row';
import { WorkItemMetaCard } from './work-item-meta-card';
import { WorkItemMetrics } from './work-item-metrics';
import { WorkItemProgressCard } from './work-item-progress-card';

interface WorkItemDetailHeaderProps {
  item: WorkItemDetail;
  onMarkDone?: () => void;
  onLogTime?: () => void;
  onOpenExternal?: () => void;
}

export function WorkItemDetailHeader({ item, onMarkDone, onLogTime, onOpenExternal,}: WorkItemDetailHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl">
      <div className="p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <WorkItemBadgeRow
              id={item.id}
              type={item.type}
              status={item.status}
              priority={item.priority}
            />
            
            <div className="mt-4">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {item.title}
              </h1>
              
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">
                {item.description}
              </p>
            </div>
            
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                <CalendarDays className="h-4 w-4 text-cyan-300" />
                <span>{item.dueDate}</span>
              </div>
              
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                <Flag className="h-4 w-4 text-violet-300" />
                <span>{item.sprintName}</span>
              </div>
              
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                <UserRound className="h-4 w-4 text-emerald-300" />
                <span>Reporter: {item.reporter.name}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 xl:min-w-[260px] xl:items-end">
            <button
              type="button"
              onClick={onMarkDone}
              className="rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-cyan-300"
            >
              Mark as Done
            </button>
            
            <button
              type="button"
              onClick={onLogTime}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Log Time
            </button>
            
            <button
              type="button"
              onClick={onOpenExternal}
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Spec
            </button>
          </div>
        </div>
        
        <WorkItemMetrics item={item} />
        
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <WorkItemProgressCard item={item} />
          <WorkItemMetaCard item={item} />
        </div>
      </div>
    </section>
  );
}
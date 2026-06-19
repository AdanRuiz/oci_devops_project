import type { WorkItemDetail } from '../types/work-item-ui.types';

interface WorkItemProgressCardProps {
  item: WorkItemDetail;
}

export function WorkItemProgressCard({ item }: WorkItemProgressCardProps) {
  const progress = Math.min(
    100,
    Math.round((item.loggedHours / item.estimatedHours) * 100),
  );
  
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">Execution progress</p>
          <p className="mt-1 text-sm text-zinc-400">
            Logged effort versus original estimate
          </p>
        </div>
        
        <p className="text-2xl font-semibold text-white">{progress}%</p>
      </div>
      
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
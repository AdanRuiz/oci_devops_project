import { CheckCircle2 } from 'lucide-react';
import type { WorkItemDetail } from '../types/work-item-ui.types';

interface WorkItemContextCardProps {
  item: WorkItemDetail;
}

export function WorkItemContextCard({ item }: WorkItemContextCardProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="border-b border-white/10 px-6 py-5">
        <h2 className="text-xl font-semibold text-white">Work context</h2>
      </div>
      
      <div className="space-y-5 p-6">
        <div>
          <p className="text-sm font-medium text-zinc-200">Description</p>
          <p className="mt-2 text-sm leading-7 text-zinc-300">
            {item.description}
          </p>
        </div>
        
        <div className="h-px bg-white/10" />
        
        <div>
          <p className="text-sm font-medium text-zinc-200">
            Acceptance criteria
          </p>
          
          <div className="mt-3 grid gap-3">
            {item.acceptanceCriteria?.map((criterion) => (
              <div
                key={criterion}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p className="text-sm text-zinc-300">{criterion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
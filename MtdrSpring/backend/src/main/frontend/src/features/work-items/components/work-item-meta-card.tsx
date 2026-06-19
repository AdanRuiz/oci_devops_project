import type { WorkItemDetail } from '../types/work-item-ui.types';
import { PersonStack } from './shared/person-stack';

interface WorkItemMetaCardProps {
  item: WorkItemDetail;
}

export function WorkItemMetaCard({ item }: WorkItemMetaCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <PersonStack people={item.assignees} />
      
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
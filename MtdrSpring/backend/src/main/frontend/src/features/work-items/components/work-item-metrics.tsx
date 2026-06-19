import { Clock3, Link2, MessageSquare, Timer } from 'lucide-react';
import type { WorkItemDetail } from '../types/work-item-ui.types';
import { MetricCard } from './shared/metric-card';

interface WorkItemMetricsProps {
  item: WorkItemDetail;
}

export function WorkItemMetrics({ item }: WorkItemMetricsProps) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        icon={<Clock3 className="h-4 w-4" />}
        label="Estimate"
        value={`${item.estimatedHours}h`}
        hint="Original planning effort"
      />
      
      <MetricCard
        icon={<Timer className="h-4 w-4" />}
        label="Logged"
        value={`${item.loggedHours}h`}
        hint="Actual work captured"
      />
      
      <MetricCard
        icon={<MessageSquare className="h-4 w-4" />}
        label="Discussion"
        value={`${item.commentsCount}`}
        hint="Active collaboration"
      />
      
      <MetricCard
        icon={<Link2 className="h-4 w-4" />}
        label="Linked items"
        value={`${item.linkedItemsCount}`}
        hint="Dependencies and blockers"
      />
    </div>
  );
}
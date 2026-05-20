import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { Activity } from 'lucide-react';
import { fetchDashboardBundle } from './dashboardApi';
import { MOCK_TASKS } from './dashboardMocks';
import ActivityListRow from './ActivityListRow';
import DashboardKpiStrip from './DashboardKpiStrip';
import { DashboardListViewSkeleton } from './DashboardSkeletons';

function DashboardActivity() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [source, setSource] = useState('api');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const bundle = await fetchDashboardBundle();
      if (cancelled) return;
      if (bundle.tasksOk) {
        setTasks(bundle.tasks);
        setUsers(bundle.usersOk ? bundle.users : []);
        setSource('api');
      } else {
        setTasks(MOCK_TASKS);
        setUsers(bundle.usersOk ? bundle.users : []);
        setSource('mock');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => {
    const usersMap = new Map(
      users.map((u) => [u.id, u.name || u.username || u.email || `User ${u.id}`])
    );
    return [...tasks]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 30)
      .map((task) => {
        const date = task.updatedAt || task.createdAt;
        const actorId = task.assignedTo ?? task.createdBy;
        const actor = usersMap.get(actorId) || `User ${actorId ?? 'unknown'}`;
        return {
          title: task.title || `Task ${task.id}`,
          detail: `${task.status || 'UNKNOWN'} · ${task.sprint?.name || 'No sprint'}`,
          by: actor,
          time: date ? moment(date).format('MMM D, YYYY · HH:mm') : '—',
        };
      });
  }, [tasks, users]);

  const kpiItems = useMemo(
    () => [
      { icon: Activity, label: 'Recent events', value: items.length, metaLabel: null },
      {
        icon: Activity,
        label: 'Done updates',
        value: tasks.filter((task) => task.status === 'DONE').length,
        metaLabel: null,
      },
      {
        icon: Activity,
        label: 'In progress',
        value: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
        metaLabel: null,
      },
    ],
    [items.length, tasks]
  );

  if (loading) {
    return <DashboardListViewSkeleton title="Loading activity" showFilters={false} />;
  }

  return (
    <div className="dashboard-page-enter space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#2A1814]">Activity</h2>
          <p className="mt-1 text-sm text-[#6B6560]">
            Recent events across tasks and sprints
            {source === 'mock' && <span className="ml-2 text-xs text-[#c74634]">(preview data)</span>}
          </p>
        </div>
      </div>

      <DashboardKpiStrip items={kpiItems} />

      <div className="border-y border-[#2A1814]/[0.08] bg-white">
        <div className="grid grid-cols-[minmax(0,1fr)_150px_170px] border-b border-[#2A1814]/[0.06] px-1 py-3 text-xs font-medium uppercase tracking-wide text-[#6B6560]">
          <span>Activity</span>
          <span>By</span>
          <span className="text-right">When</span>
        </div>
        {items.length === 0 ? (
          <p className="px-1 py-6 text-sm text-[#6B6560]">No activity yet.</p>
        ) : (
          <div>
            {items.map((item, index) => (
              <ActivityListRow
                key={`${item.title}-${index}`}
                item={item}
                isLast={index === items.length - 1}
                rowIndex={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardActivity;

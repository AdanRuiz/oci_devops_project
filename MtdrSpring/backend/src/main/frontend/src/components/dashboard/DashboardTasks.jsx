import { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { ChevronDown, ClipboardList, Filter, Search } from 'lucide-react';
import { fetchDashboardBundle } from './dashboardApi';
import { MOCK_TASKS } from './dashboardMocks';
import DashboardKpiStrip from './DashboardKpiStrip';
import { DashboardListViewSkeleton } from './DashboardSkeletons';

const statusOptions = ['ALL', 'PENDING', 'TODO', 'IN_PROGRESS', 'DONE'];

function formatStatusLabel(status) {
  if (status === 'ALL') return 'All statuses';
  const normalized = String(status || '').toLowerCase().replace(/_/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function statusPillClass(status) {
  switch (status) {
    case 'DONE':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-600/15';
    case 'IN_PROGRESS':
      return 'bg-amber-50 text-amber-900 ring-amber-600/15';
    case 'TODO':
      return 'bg-[#c74634]/10 text-[#c74634] ring-[#c74634]/20';
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-600/10';
  }
}

function DashboardTasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [source, setSource] = useState('api');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusMenuRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const bundle = await fetchDashboardBundle();
      if (cancelled) return;
      if (bundle.tasksOk) {
        setTasks(bundle.tasks);
        setSource('api');
      } else {
        setTasks(MOCK_TASKS);
        setSource('mock');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!statusMenuRef.current?.contains(event.target)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      const matchesText =
        text.length === 0 ||
        task.title?.toLowerCase().includes(text) ||
        task.description?.toLowerCase().includes(text) ||
        task.sprint?.name?.toLowerCase().includes(text);
      return matchesStatus && matchesText;
    });
  }, [tasks, query, statusFilter]);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      done: tasks.filter((t) => t.status === 'DONE').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      blocked: tasks.filter((t) => t.status === 'PENDING').length,
    }),
    [tasks]
  );

  const kpiItems = useMemo(
    () => [
      {
        icon: ClipboardList,
        label: 'Total',
        value: counts.total,
        trend: counts.total > 0 ? { direction: 'up', label: `+${counts.inProgress} active` } : null,
      },
      {
        icon: Filter,
        label: 'In progress',
        value: counts.inProgress,
        trend:
          counts.inProgress > 0
            ? { direction: 'up', label: `+${counts.done} done` }
            : counts.done > 0
              ? { direction: 'down', label: `${counts.blocked} backlog` }
              : null,
      },
      {
        icon: ClipboardList,
        label: 'Completion',
        value: counts.total > 0 ? `${Math.round((counts.done / counts.total) * 100)}%` : '0%',
        trend: counts.done > 0 ? { direction: 'up', label: `+${counts.done} done` } : null,
      },
    ],
    [counts]
  );

  if (loading) {
    return <DashboardListViewSkeleton title="Loading tasks" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#2A1814]">Tasks</h2>
          <p className="mt-1 text-sm text-[#6B6560]">
            Track workload across all teams
            {source === 'mock' && <span className="ml-2 text-xs text-[#c74634]">(preview data)</span>}
          </p>
        </div>
      </div>

      <DashboardKpiStrip items={kpiItems} />

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
        <label className="block">
          <span className="mb-2 block text-sm text-[#2a1814]/60">Search</span>
          <span className="flex items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 focus-within:border-[#2a1814]">
            <Search className="h-4 w-4 shrink-0 text-[#2a1814]/45" />
            <input
              id="task-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, description, sprint..."
              className="w-full border-0 bg-transparent text-sm text-[#2a1814] placeholder:text-[#2a1814]/35 focus:outline-none focus:ring-0"
            />
          </span>
        </label>
        <label className="block" ref={statusMenuRef}>
          <span className="mb-2 block text-sm text-[#2a1814]/60">Filter</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStatusOpen((prev) => !prev)}
              className="flex w-full items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 text-left focus:border-[#2a1814] focus:outline-none"
              aria-haspopup="listbox"
              aria-expanded={isStatusOpen}
            >
              <Filter className="h-4 w-4 shrink-0 text-[#2a1814]/45" />
              <span className="w-full text-sm text-[#2a1814]">{formatStatusLabel(statusFilter)}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-[#2a1814]/55" />
            </button>
            {isStatusOpen && (
              <div className="absolute right-0 z-20 mt-2 w-full min-w-[200px] overflow-hidden rounded-xl border border-[#2A1814]/10 bg-white shadow-lg">
                <ul role="listbox" className="py-1">
                  {statusOptions.map((status) => {
                    const isActive = statusFilter === status;
                    return (
                      <li key={status}>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter(status);
                            setIsStatusOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm transition ${
                            isActive
                              ? 'bg-[#2A1814] text-white'
                              : 'text-[#2A1814] hover:bg-[#faf9f6]'
                          }`}
                        >
                          {formatStatusLabel(status)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </label>
      </div>

      <div className="border-y border-[#2A1814]/[0.08] bg-white">
        <div className="px-1 py-3">
          <h3 className="text-sm font-semibold text-[#2A1814]">{filtered.length} tasks</h3>
        </div>
        {filtered.length === 0 ? (
          <p className="px-1 py-6 text-sm text-[#6B6560]">No tasks match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#2A1814]/[0.06] text-xs font-medium uppercase tracking-wide text-[#6B6560]">
                <tr>
                  <th className="px-1 py-3">Task</th>
                  <th className="px-1 py-3">Sprint</th>
                  <th className="px-1 py-3">Status</th>
                  <th className="px-1 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A1814]/[0.06]">
                {filtered.map((task, index) => (
                  <tr
                    key={task.id}
                    className={`transition-colors hover:bg-[#2A1814]/[0.02] ${index === filtered.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <td className="px-1 py-3.5">
                      <p className="font-medium text-[#2A1814]">{task.title || `Task ${task.id}`}</p>
                      <p className="mt-0.5 max-w-[40ch] truncate text-xs text-[#6B6560]">
                        {task.description || 'No description'}
                      </p>
                    </td>
                    <td className="px-1 py-3.5 text-[#6B6560]">{task.sprint?.name || 'Unassigned'}</td>
                    <td className="px-1 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusPillClass(task.status)}`}
                      >
                        {formatStatusLabel(task.status || 'UNKNOWN')}
                      </span>
                    </td>
                    <td className="px-1 py-3.5 text-xs text-[#6B6560]">
                      {task.updatedAt || task.createdAt
                        ? moment(task.updatedAt || task.createdAt).format('MMM D, YYYY')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardTasks;

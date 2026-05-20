import React, { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  LogOut,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import NewItem from './NewItem';
import API_LIST from './API';
import { DevAppSkeleton } from './components/dashboard/DashboardSkeletons';
import DevTaskRow from './components/dev/DevTaskRow';
import AppToast from './components/ui/AppToast';
import EditTaskModal from './components/dev/EditTaskModal';
import { useAppToast } from './hooks/useAppToast';
import { DEV_STATUS_OPTIONS, nextStatus, updateTask } from './components/dev/devTaskApi';

const BACKLOG_KEY = 'backlog';

function getInitials(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return 'AL';
}

function formatToday() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

function formatStatusLabel(status) {
  const normalized = String(status || '').toLowerCase().replace(/_/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function priorityPillClass(priority) {
  switch (priority) {
    case 'HIGH':
      return 'bg-[#c74634]/10 text-[#c74634]';
    case 'MEDIUM':
      return 'bg-amber-50 text-amber-800';
    case 'LOW':
      return 'bg-emerald-50 text-emerald-700';
    default:
      return 'bg-slate-50 text-slate-700';
  }
}

function determineCurrentSprint(sprintList) {
  if (!sprintList?.length) return null;
  const now = moment();
  const current = sprintList.find((sprint) => {
    if (!sprint.startDate) return false;
    const start = moment(sprint.startDate);
    const end = sprint.endDate ? moment(sprint.endDate) : null;
    return start.isBefore(now) && (!end || end.isAfter(now));
  });
  if (current) return current;
  return [...sprintList].sort((a, b) => {
    const aDate = a.startDate ? moment(a.startDate) : moment(0);
    const bDate = b.startDate ? moment(b.startDate) : moment(0);
    return bDate.diff(aDate);
  })[0];
}

function sortSprints(sprintList, currentSprint) {
  if (!currentSprint) return sprintList;
  return [...sprintList].sort((a, b) => {
    if (a.id === currentSprint.id) return -1;
    if (b.id === currentSprint.id) return 1;
    const aDate = a.startDate ? moment(a.startDate) : moment(0);
    const bDate = b.startDate ? moment(b.startDate) : moment(0);
    return bDate.diff(aDate);
  });
}

function App() {
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const [isLoading, setLoading] = useState(true);
  const [isInserting, setInserting] = useState(false);
  const [items, setItems] = useState([]);
  const [sprints, setSprints] = useState([]);
  const { toast, showSuccess, showError, dismissToast } = useAppToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [bugsOnly, setBugsOnly] = useState(false);
  const [currentSprint, setCurrentSprint] = useState(null);
  const [visibleSprints, setVisibleSprints] = useState([]);
  const [expandedSprints, setExpandedSprints] = useState({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [firstName, setFirstName] = useState('Alex');
  const [displayName, setDisplayName] = useState('Alex Rivera');
  const [initials, setInitials] = useState('AL');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);

  const getSprintTasks = (sprintId) => items.filter((item) => item.sprint?.id === sprintId);
  const unassignedTasks = useMemo(() => items.filter((item) => !item.sprint?.id), [items]);

  const applyTaskFilters = (tasks) => {
    const token = searchTerm.trim().toLowerCase();
    return tasks.filter((task) => {
      const status = String(task.status || '').toUpperCase();
      if (statusFilter !== 'ALL' && status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
      if (bugsOnly && !task.isBug) return false;
      if (token) {
        return (
          task.title?.toLowerCase().includes(token) ||
          task.description?.toLowerCase().includes(token) ||
          status.toLowerCase().includes(token) ||
          task.priority?.toLowerCase().includes(token)
        );
      }
      return true;
    });
  };

  function replaceTask(updated) {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  function handleTaskSaved(updated, message) {
    replaceTask(updated);
    showSuccess(message);
  }

  function handleStatusChange(task, status) {
    updateTask(task, { status })
      .then((updated) => handleTaskSaved(updated, `Status updated to ${formatStatusLabel(status)}`))
      .catch((err) => showError(err));
  }

  function deleteItem(deleteId) {
    fetch(`${API_LIST}/${deleteId}`, { method: 'DELETE' })
      .then((response) => {
        if (response.ok) return response;
        throw new Error('Could not delete task');
      })
      .then(() => {
        setItems((prev) => prev.filter((item) => item.id !== deleteId));
        setPendingDeleteId(null);
        showSuccess('Task deleted');
      })
      .catch((err) => showError(err));
  }

  function renderTaskGroups(tasks, groupKey) {
    const filteredTasks = applyTaskFilters(tasks);
    const pendingTasks = filteredTasks.filter((task) => String(task.status || '').toUpperCase() !== 'DONE');
    const completedTasks = filteredTasks.filter((task) => String(task.status || '').toUpperCase() === 'DONE');

    if (filteredTasks.length === 0) {
      return (
        <p className="text-sm text-[#6B6560]">
          {tasks.length === 0 ? 'No tasks here yet.' : 'No tasks match your filters.'}
        </p>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#2A1814]">Pending tasks</h4>
            <span className="text-xs text-[#6B6560]">{pendingTasks.length}</span>
          </div>
          <div className="overflow-hidden">
            {pendingTasks.length === 0 ? (
              <p className="px-1 py-3 text-sm text-[#6B6560]">No pending tasks.</p>
            ) : (
              pendingTasks.map((item, idx) => (
                <DevTaskRow
                  key={item.id}
                  item={item}
                  highlighted={highlightedTaskId === item.id}
                  isCompleted={false}
                  formatStatusLabel={formatStatusLabel}
                  priorityPillClass={priorityPillClass}
                  pendingDeleteId={pendingDeleteId}
                  onAdvance={(t) => handleStatusChange(t, nextStatus(t.status))}
                  onMarkDone={(t) => handleStatusChange(t, 'DONE')}
                  onReopen={(t) => handleStatusChange(t, 'PENDING')}
                  onEdit={setEditingTask}
                  onDeleteRequest={setPendingDeleteId}
                  onConfirmDelete={deleteItem}
                  onCancelDelete={() => setPendingDeleteId(null)}
                  animationDelay={Math.min(idx * 20, 180)}
                />
              ))
            )}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#6B6560]">Completed</h4>
            <span className="text-xs text-[#6B6560]">{completedTasks.length}</span>
          </div>
          <div className="overflow-hidden">
            {completedTasks.length === 0 ? (
              <p className="px-1 py-3 text-sm text-[#6B6560]">No completed tasks yet.</p>
            ) : (
              completedTasks.map((item, idx) => (
                <DevTaskRow
                  key={item.id}
                  item={item}
                  highlighted={highlightedTaskId === item.id}
                  isCompleted
                  formatStatusLabel={formatStatusLabel}
                  priorityPillClass={priorityPillClass}
                  pendingDeleteId={pendingDeleteId}
                  onAdvance={() => {}}
                  onMarkDone={() => {}}
                  onReopen={(t) => handleStatusChange(t, 'PENDING')}
                  onEdit={setEditingTask}
                  onDeleteRequest={setPendingDeleteId}
                  onConfirmDelete={deleteItem}
                  onCancelDelete={() => setPendingDeleteId(null)}
                  animationDelay={Math.min(idx * 20, 180)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tasksResponse, sprintsResponse, usersResponse] = await Promise.all([
          fetch(API_LIST),
          fetch('/sprints'),
          fetch('/users'),
        ]);
        if (!tasksResponse.ok) throw new Error('Could not load tasks');

        const tasks = await tasksResponse.json();
        const sprintResult = sprintsResponse.ok ? await sprintsResponse.json() : [];
        const users = usersResponse.ok ? await usersResponse.json() : [];

        if (cancelled) return;
        setItems(tasks);
        setSprints(sprintResult);

        const userName = users?.[0]?.name || users?.[0]?.username || 'Alex';
        setDisplayName(userName);
        setFirstName(userName.split(/\s+/)[0] || 'Alex');
        setInitials(getInitials(userName));

        const current = determineCurrentSprint(sprintResult);
        setCurrentSprint(current);
        const backlogCount = tasks.filter((t) => !t.sprint?.id).length;
        const initialExpanded = backlogCount > 0 ? { [BACKLOG_KEY]: true } : {};
        if (current) {
          setVisibleSprints([current.id]);
          setExpandedSprints({ ...initialExpanded, [current.id]: true });
        } else if (sprintResult.length > 0) {
          setVisibleSprints([sprintResult[0].id]);
          setExpandedSprints({ ...initialExpanded, [sprintResult[0].id]: true });
        } else {
          setExpandedSprints(initialExpanded);
        }
      } catch (err) {
        if (!cancelled) showError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dev-app-active');
    return () => document.documentElement.classList.remove('dev-app-active');
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    function handlePointerDown(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    function handlePointerDown(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [notificationsOpen]);

  useEffect(() => {
    if (!highlightedTaskId) return undefined;
    const timer = window.setTimeout(() => setHighlightedTaskId(null), 5000);
    return () => window.clearTimeout(timer);
  }, [highlightedTaskId]);

  function addItem(taskData) {
    setInserting(true);
    const data = {
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      expectedHours: taskData.expectedHours,
      hoursDone: 0,
      isBug: taskData.isBug,
      assignedTo: 1,
      createdBy: 1,
      vector: 'web',
    };

    return fetch(API_LIST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) return response;
        throw new Error('Could not create task');
      })
      .then((result) => {
        const id = Number(result.headers.get('location'));
        if (!id) throw new Error('Task created but no location header was returned');

        if (!taskData.sprintId) {
          return fetch(`${API_LIST}/${id}`).then((taskResponse) => {
            if (!taskResponse.ok) throw new Error('Task created but it could not be reloaded');
            return taskResponse.json();
          });
        }

        return fetch('/sprint-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: { sprintId: taskData.sprintId, taskId: id },
            addedAt: moment().format('YYYY-MM-DDTHH:mm:ss'),
          }),
        }).then((linkResponse) => {
          if (!linkResponse.ok) throw new Error('Task created, but sprint assignment failed');
          return fetch(`${API_LIST}/${id}`).then((taskResponse) => {
            if (!taskResponse.ok) throw new Error('Task created but it could not be reloaded');
            return taskResponse.json();
          });
        });
      })
      .then((createdTask) => {
        setItems((prev) => [createdTask, ...prev]);
        setHighlightedTaskId(createdTask.id);
        if (createdTask.sprint?.id) {
          setVisibleSprints((prev) => [...new Set([...prev, createdTask.sprint.id])]);
          setExpandedSprints((prev) => ({ ...prev, [createdTask.sprint.id]: true }));
        } else {
          setExpandedSprints((prev) => ({ ...prev, [BACKLOG_KEY]: true }));
        }
        showSuccess(`“${createdTask.title}” added to your ${createdTask.sprint?.name ? 'sprint' : 'backlog'}`);
        return createdTask;
      })
      .catch((err) => showError(err))
      .finally(() => setInserting(false));
  }

  const orderedSprints = useMemo(() => sortSprints(sprints, currentSprint), [sprints, currentSprint]);

  const visibleCountText = `${visibleSprints.length} of ${sprints.length} sprints visible`;
  const totalPendingTasks = useMemo(
    () => items.filter((task) => String(task.status || '').toUpperCase() !== 'DONE').length,
    [items]
  );
  const isEmptyState = !isLoading && totalPendingTasks === 0;
  const today = formatToday();

  return (
    <section className="dev-app-page app-scrollbar min-h-dvh min-h-screen w-full bg-[#faf9f6] text-[#2A1814]">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="dashboard-page-enter space-y-8">
          <header className="border-b border-[#2A1814]/[0.08] pb-6">
            <div className="dashboard-section-enter mb-6 flex items-center justify-between gap-4">
              <Link to="/" className="inline-flex shrink-0 transition-opacity hover:opacity-80" aria-label="Go to home">
                <img src="/lettermark-b.svg" alt="Lumen" className="h-8 w-auto object-contain sm:h-9" />
              </Link>

              <div className="relative flex shrink-0 items-center gap-3 sm:gap-4">
                <p className="m-0 hidden text-sm leading-none text-[#6B6560] md:block">{today}</p>

                <Link
                  to="/lumi"
                  className="inline-flex items-center gap-2 rounded-full p-2 text-sm font-medium text-[#6B6560] transition hover:bg-[#2A1814]/[0.04] hover:text-[#2A1814] sm:px-1"
                  aria-label="Open Lumi assistant"
                >
                  <img src="/lumi-ico-b.svg" alt="" className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Lumi</span>
                </Link>

                <div ref={notificationsRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen((open) => !open);
                      setProfileMenuOpen(false);
                    }}
                    className="relative rounded-full p-2 text-[#6B6560] transition hover:bg-[#2A1814]/[0.04] hover:text-[#2A1814]"
                    aria-expanded={notificationsOpen}
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#c74634]" />
                  </button>
                  {notificationsOpen && (
                    <div className="dashboard-modal-panel-enter absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#2A1814]/10 bg-white p-4 shadow-lg ring-1 ring-black/[0.04]">
                      <p className="text-sm font-medium text-[#2A1814]">Notifications</p>
                      <p className="mt-2 text-sm text-[#6B6560]">You&apos;re all caught up. Sprint and task alerts will show here.</p>
                    </div>
                  )}
                </div>

                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen((open) => !open);
                      setNotificationsOpen(false);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c74634]/15 text-sm font-semibold text-[#c74634] transition hover:bg-[#c74634]/25"
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Profile menu"
                  >
                    {initials}
                  </button>

                  {profileMenuOpen && (
                    <div
                      role="menu"
                      className="dashboard-modal-panel-enter absolute right-0 top-full z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-[#2A1814]/10 bg-white py-1 shadow-lg ring-1 ring-black/[0.04]"
                    >
                      <div className="border-b border-[#2A1814]/[0.06] px-3 py-2.5">
                        <p className="text-sm font-medium text-[#2A1814]">{displayName}</p>
                        <p className="text-xs text-[#6B6560]">Developer</p>
                      </div>
                      <Link
                        to="/dashboard"
                        role="menuitem"
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#2A1814] transition hover:bg-[#faf9f6]"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 shrink-0 text-[#6B6560]" />
                        Manager dashboard
                      </Link>
                      <Link
                        to="/"
                        role="menuitem"
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#2A1814] transition hover:bg-[#faf9f6]"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Lumen home
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#2A1814] transition hover:bg-[#faf9f6]"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          navigate('/login');
                        }}
                      >
                        <LogOut className="h-4 w-4 shrink-0 text-[#6B6560]" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-section-enter" style={{ animationDelay: '60ms' }}>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Hi {firstName},</h1>
            <p className="mt-1 text-[34px] font-medium italic leading-tight text-[#c74634]">
              {isEmptyState ? "you're all caught up :)" : 'you have items pending.'}
            </p>
            <p className="mt-4 max-w-xl text-sm text-[#6B6560]">
              {isEmptyState
                ? 'No pending tasks right now. Great pace—keep it up.'
                : 'Organize your day by reviewing sprint tasks and keeping momentum.'}
            </p>
            </div>
          </header>

          <div className="dashboard-section-enter" style={{ animationDelay: '100ms' }}>
            <NewItem addItem={addItem} isInserting={isInserting} sprints={sprints} />
          </div>

          <div
            className="dashboard-section-enter flex flex-col gap-3 rounded-xl border border-[#2A1814]/[0.08] bg-[#fff8f6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ animationDelay: '120ms' }}
          >
            <div>
              <p className="text-sm font-medium text-[#2A1814]">Need a hand with your sprint?</p>
              <p className="mt-1 text-sm text-[#6B6560]">
                Ask Lumi to break down work, triage bugs, or summarize what&apos;s left in your backlog.
              </p>
            </div>
            <Link
              to="/lumi"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[#c74634] transition hover:text-[#a83a2b]"
            >
              Open Lumi
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <DevAppSkeleton />
          ) : (
            <div className="dashboard-section-enter space-y-8" style={{ animationDelay: '140ms' }}>
              <section className="dashboard-section-enter space-y-4" style={{ animationDelay: '180ms' }}>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#2a1814]/60">Search tasks</span>
                    <span className="flex items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 focus-within:border-[#2a1814]">
                      <Search className="h-4 w-4 shrink-0 text-[#2a1814]/45" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by title, description, status or priority..."
                        className="w-full border-0 bg-transparent text-sm text-[#2a1814] placeholder:text-[#2a1814]/35 focus:outline-none focus:ring-0"
                      />
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowFilterPanel((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#2A1814]/15 bg-white px-4 py-2 text-sm text-[#2A1814] transition hover:bg-[#f5f2ec]"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </button>
                    <span className="text-xs text-[#6B6560]">{visibleCountText}</span>
                  </div>
                </div>

                {showFilterPanel && (
                  <div className="dashboard-modal-panel-enter space-y-5 rounded-xl border border-[#2A1814]/10 bg-white p-4">
                    <div>
                      <p className="mb-3 text-sm font-medium text-[#2A1814]">Task filters</p>
                      <div className="flex flex-wrap gap-2">
                        {DEV_STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setStatusFilter(opt.value)}
                            className={`rounded-full px-3 py-1.5 text-xs transition ${
                              statusFilter === opt.value
                                ? 'bg-[#2A1814] text-white'
                                : 'bg-[#faf9f6] text-[#6B6560] ring-1 ring-[#2A1814]/10'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                        {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriorityFilter(p)}
                            className={`rounded-full px-3 py-1.5 text-xs transition ${
                              priorityFilter === p
                                ? 'bg-[#2A1814] text-white'
                                : 'bg-[#faf9f6] text-[#6B6560] ring-1 ring-[#2A1814]/10'
                            }`}
                          >
                            {p === 'ALL' ? 'All priorities' : p.charAt(0) + p.slice(1).toLowerCase()}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setBugsOnly((v) => !v)}
                          className={`rounded-full px-3 py-1.5 text-xs transition ${
                            bugsOnly
                              ? 'bg-[#c74634] text-white'
                              : 'bg-[#faf9f6] text-[#6B6560] ring-1 ring-[#2A1814]/10'
                          }`}
                        >
                          Bugs only
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium text-[#2A1814]">Sprint visibility</p>
                      <div className="flex flex-wrap gap-2">
                        {orderedSprints.map((sprint, idx) => {
                          const visible = visibleSprints.includes(sprint.id);
                          const isCurrent = sprint.id === currentSprint?.id;
                          return (
                            <button
                              key={sprint.id}
                              type="button"
                              onClick={() =>
                                setVisibleSprints((prev) =>
                                  visible ? prev.filter((id) => id !== sprint.id) : [...prev, sprint.id]
                                )
                              }
                              className={`dashboard-row-enter rounded-full px-3 py-1.5 text-xs transition ${
                                visible
                                  ? 'bg-[#2A1814] text-white'
                                  : 'bg-[#faf9f6] text-[#6B6560] ring-1 ring-[#2A1814]/10'
                              }`}
                              style={{ animationDelay: `${Math.min(idx * 25, 180)}ms` }}
                            >
                              {sprint.name}
                              {isCurrent ? ' · Current' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {orderedSprints.length === 0 && unassignedTasks.length === 0 ? (
                <div className="dashboard-section-enter py-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#2A1814]/10 bg-[#fffdf9]">
                    <img src="/logo-b.svg" alt="Lumen" className="h-8 w-auto object-contain opacity-80" />
                  </div>
                  <h3 className="text-base font-semibold text-[#2A1814]">All clear here</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-[#6B6560]">
                    No sprints or tasks yet. Add work from the button above or ask Lumi for help.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unassignedTasks.length > 0 && (
                    <section className="dashboard-row-enter overflow-hidden border-b border-[#2A1814]/10 pb-4">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSprints((prev) => ({
                            ...prev,
                            [BACKLOG_KEY]: !prev[BACKLOG_KEY],
                          }))
                        }
                        className="w-full bg-[#faf9f6]/80 px-1 py-4 text-left transition hover:bg-[#faf9f6]"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {expandedSprints[BACKLOG_KEY] ? (
                              <ChevronUp className="h-4 w-4 text-[#6B6560]" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-[#6B6560]" />
                            )}
                            <div>
                              <h3 className="text-base font-semibold text-[#2A1814]">Backlog</h3>
                              <p className="mt-1 text-xs text-[#6B6560]">Tasks not assigned to a sprint</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-[#faf9f6] px-3 py-1 text-xs text-[#6B6560] ring-1 ring-[#2A1814]/10">
                            {applyTaskFilters(unassignedTasks).length} tasks
                          </span>
                        </div>
                      </button>
                      {expandedSprints[BACKLOG_KEY] && (
                        <div className="border-t border-[#2A1814]/[0.08] px-1 py-5">
                          {renderTaskGroups(unassignedTasks)}
                        </div>
                      )}
                    </section>
                  )}

                  {orderedSprints.map((sprint, sprintIndex) => {
                    if (!visibleSprints.includes(sprint.id)) return null;
                    const sprintTasks = getSprintTasks(sprint.id);
                    const isExpanded = expandedSprints[sprint.id];
                    const isCurrent = sprint.id === currentSprint?.id;

                    return (
                      <section
                        key={sprint.id}
                        className="dashboard-row-enter overflow-hidden border-b border-[#2A1814]/10 pb-4"
                        style={{ animationDelay: `${Math.min(sprintIndex * 28, 200)}ms` }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSprints((prev) => ({
                              ...prev,
                              [sprint.id]: !prev[sprint.id],
                            }))
                          }
                          className={`w-full px-1 py-4 text-left transition hover:bg-[#faf9f6] ${
                            isCurrent ? 'bg-[#fff8f6]' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-[#6B6560]" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-[#6B6560]" />
                              )}
                              <div>
                                <h3 className="text-base font-semibold text-[#2A1814]">
                                  {sprint.name}
                                  {isCurrent && (
                                    <span className="ml-2 rounded-full bg-[#c74634]/10 px-2 py-0.5 text-xs font-semibold text-[#c74634]">
                                      Current
                                    </span>
                                  )}
                                </h3>
                                <p className="mt-1 text-xs text-[#6B6560]">
                                  {sprint.startDate && `Start ${moment(sprint.startDate).format('MMM D, YYYY')}`}
                                  {sprint.endDate && ` · End ${moment(sprint.endDate).format('MMM D, YYYY')}`}
                                </p>
                              </div>
                            </div>
                            <span className="rounded-full bg-[#faf9f6] px-3 py-1 text-xs text-[#6B6560] ring-1 ring-[#2A1814]/10">
                              {applyTaskFilters(sprintTasks).length} tasks
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-[#2A1814]/[0.08] px-1 py-5">
                            {renderTaskGroups(sprintTasks)}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <EditTaskModal
        open={Boolean(editingTask)}
        task={editingTask}
        sprints={sprints}
        onClose={() => setEditingTask(null)}
        onSaved={(updated) => handleTaskSaved(updated, 'Task updated')}
        onError={showError}
      />
      <AppToast toast={toast} onDismiss={dismissToast} />
    </section>
  );
}

export default App;

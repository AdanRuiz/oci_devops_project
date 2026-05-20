import React, { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LogOut,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import NewItem from './NewItem';
import API_LIST from './API';
import { DevAppSkeleton } from './components/dashboard/DashboardSkeletons';

function getInitials(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return 'AL';
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
  const [isLoading, setLoading] = useState(true);
  const [isInserting, setInserting] = useState(false);
  const [items, setItems] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [error, setError] = useState();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSprint, setCurrentSprint] = useState(null);
  const [visibleSprints, setVisibleSprints] = useState([]);
  const [expandedSprints, setExpandedSprints] = useState({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [firstName, setFirstName] = useState('Alex');
  const [initials, setInitials] = useState('AL');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const getSprintTasks = (sprintId) => items.filter((item) => item.sprint?.id === sprintId);

  const filterTasksBySearch = (tasks) => {
    if (!searchTerm.trim()) return tasks;
    const token = searchTerm.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title?.toLowerCase().includes(token) ||
        task.description?.toLowerCase().includes(token) ||
        task.status?.toLowerCase().includes(token) ||
        task.priority?.toLowerCase().includes(token)
    );
  };

  function deleteItem(deleteId) {
    fetch(`${API_LIST}/${deleteId}`, { method: 'DELETE' })
      .then((response) => {
        if (response.ok) return response;
        throw new Error('Could not delete task');
      })
      .then(() => setItems((prev) => prev.filter((item) => item.id !== deleteId)))
      .catch((err) => setError(err));
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
        setFirstName(userName.split(/\s+/)[0] || 'Alex');
        setInitials(getInitials(userName));

        const current = determineCurrentSprint(sprintResult);
        setCurrentSprint(current);
        if (current) {
          setVisibleSprints([current.id]);
          setExpandedSprints({ [current.id]: true });
        } else if (sprintResult.length > 0) {
          setVisibleSprints([sprintResult[0].id]);
          setExpandedSprints({ [sprintResult[0].id]: true });
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
      .then((createdTask) => setItems((prev) => [createdTask, ...prev]))
      .catch((err) => setError(err))
      .finally(() => setInserting(false));
  }

  const orderedSprints = useMemo(() => sortSprints(sprints, currentSprint), [sprints, currentSprint]);

  const visibleCountText = `${visibleSprints.length} of ${sprints.length} sprints visible`;
  const totalPendingTasks = useMemo(
    () => items.filter((task) => String(task.status || '').toUpperCase() !== 'DONE').length,
    [items]
  );
  const isEmptyState = !isLoading && totalPendingTasks === 0;

  return (
    <section className="dev-app-page app-scrollbar min-h-screen bg-[#faf9f6] text-[#2A1814]">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="dashboard-page-enter space-y-8">
          <header className="border-b border-[#2A1814]/[0.08] pb-6">
            <div className="dashboard-section-enter mb-6 flex items-center justify-between gap-4">
              <Link to="/" className="inline-flex shrink-0 transition-opacity hover:opacity-80" aria-label="Go to home">
                <img src="/lettermark-b.svg" alt="Lumen" className="h-8 w-auto object-contain sm:h-9" />
              </Link>

              <div ref={profileMenuRef} className="relative flex shrink-0 items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  className="relative rounded-full p-2 text-[#6B6560] transition hover:bg-[#2A1814]/[0.04] hover:text-[#2A1814]"
                  aria-label="Notificaciones"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#c74634]" />
                </button>

                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((open) => !open)}
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
                    className="dashboard-modal-panel-enter absolute right-0 top-full z-50 mt-2 min-w-[11rem] rounded-xl border border-[#2A1814]/10 bg-white py-1 shadow-lg ring-1 ring-black/[0.04]"
                  >
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

          {error && (
            <p className="dashboard-section-enter rounded-xl border border-[#c74634]/25 bg-[#fff6f4] px-4 py-2.5 text-sm text-[#c74634]">
              Error: {error.message}
            </p>
          )}

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
                      Filter sprints
                    </button>
                    <span className="text-xs text-[#6B6560]">{visibleCountText}</span>
                  </div>
                </div>

                {showFilterPanel && (
                  <div className="dashboard-modal-panel-enter rounded-xl border border-[#2A1814]/10 bg-white p-4">
                    <p className="mb-3 text-sm font-medium text-[#2A1814]">Toggle sprint visibility</p>
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
                )}
              </section>

              {orderedSprints.length === 0 ? (
                <div className="dashboard-section-enter py-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#2A1814]/10 bg-[#fffdf9]">
                    <img src="/logo-b.svg" alt="Golden Vision logo" className="h-8 w-auto object-contain opacity-80" />
                  </div>
                  <h3 className="text-base font-semibold text-[#2A1814]">All clear here</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-[#6B6560]">
                    No sprints are visible yet. Create or activate one to start organizing tasks.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderedSprints.map((sprint, sprintIndex) => {
                    if (!visibleSprints.includes(sprint.id)) return null;
                    const sprintTasks = getSprintTasks(sprint.id);
                    const filteredTasks = filterTasksBySearch(sprintTasks);
                    const isExpanded = expandedSprints[sprint.id];
                    const isCurrent = sprint.id === currentSprint?.id;
                    const pendingTasks = filteredTasks.filter((task) => task.status !== 'DONE');
                    const completedTasks = filteredTasks.filter((task) => task.status === 'DONE');

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
                              {filteredTasks.length} tasks
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-[#2A1814]/[0.08] px-1 py-5">
                            {filteredTasks.length === 0 ? (
                              <p className="text-sm text-[#6B6560]">
                                {sprintTasks.length === 0
                                  ? 'No tasks in this sprint.'
                                  : 'No tasks match your search.'}
                              </p>
                            ) : (
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
                                        <div
                                          key={item.id}
                                          className="dashboard-row-enter flex items-center justify-between gap-3 border-b border-[#2A1814]/[0.08] px-1 py-3.5 transition-colors hover:bg-[#2A1814]/[0.015] last:border-b-0"
                                          style={{ animationDelay: `${Math.min(idx * 20, 180)}ms` }}
                                        >
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-[#2A1814]">{item.title}</p>
                                            <p className="mt-1 truncate text-xs text-[#6B6560]">
                                              {item.description || 'No description'} · {formatStatusLabel(item.status)}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2 text-xs">
                                              {item.isBug && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-[#c74634]/10 px-2 py-0.5 font-medium text-[#c74634]">
                                                  <Bug className="h-3 w-3" />
                                                  Bug
                                                </span>
                                              )}
                                              <span className={`rounded-full px-2 py-0.5 font-medium ${priorityPillClass(item.priority)}`}>
                                                {item.priority || 'N/A'}
                                              </span>
                                              <span className="text-[#6B6560]">Estimate: {item.expectedHours || 0}h</span>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => deleteItem(item.id)}
                                            className="inline-flex items-center gap-1 rounded-full bg-[#2A1814] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1d110e]"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete
                                          </button>
                                        </div>
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
                                        <div
                                          key={item.id}
                                          className="dashboard-row-enter flex items-start gap-3 border-b border-[#2A1814]/[0.08] px-1 py-3.5 transition-colors hover:bg-[#2A1814]/[0.015] last:border-b-0"
                                          style={{ animationDelay: `${Math.min(idx * 20, 180)}ms` }}
                                        >
                                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#c74634]" />
                                          <div className="min-w-0">
                                            <p className="truncate text-sm text-[#6B6560] line-through">{item.title}</p>
                                            <p className="mt-1 text-xs text-[#6B6560]">
                                              Completed: {item.updatedAt ? moment(item.updatedAt).fromNow() : 'recently'}
                                            </p>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
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
    </section>
  );
}

export default App;

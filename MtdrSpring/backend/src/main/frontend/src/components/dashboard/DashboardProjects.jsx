import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { fetchDashboardBundle } from './dashboardApi';
import { MOCK_SPRINTS, MOCK_TASKS, MOCK_TEAMS } from './dashboardMocks';
import { mapTeamsToProjects, partitionProjects, summarizeProjects } from './mapProjects';
import ProjectListSection from './ProjectListSection';
import ProjectsKpiStrip from './ProjectsKpiStrip';
import { DashboardProjectsSkeleton } from './DashboardSkeletons';

function initialsFromName(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return 'NA';
}

function DashboardProjects() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [dataSource, setDataSource] = useState('api');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    managerId: '',
    teamId: '',
    memberIds: [],
  });
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const managerMenuRef = useRef(null);
  const teamMenuRef = useRef(null);

  const loadProjects = useCallback(async () => {
    const bundle = await fetchDashboardBundle();

    let teams = bundle.teams;
    let tasks = bundle.tasks;
    let sprints = bundle.sprints;
    let source = 'api';

    if (!bundle.teamsOk) {
      teams = MOCK_TEAMS;
      tasks = bundle.tasksOk && bundle.tasks.length > 0 ? bundle.tasks : MOCK_TASKS;
      sprints = bundle.sprintsOk && bundle.sprints.length > 0 ? bundle.sprints : MOCK_SPRINTS;
      source = 'mock';
    } else if (teams.length === 0) {
      source = 'empty';
    }

    return {
      projectsData: mapTeamsToProjects(teams, tasks, sprints),
      usersData: bundle.usersOk && Array.isArray(bundle.users) ? bundle.users : [],
      teamsData: Array.isArray(teams) ? teams : [],
      source,
    };
  }, []);

  const handleMemberToggle = (userId) => {
    setCreateForm((prev) => {
      const selected = new Set(prev.memberIds.map(String));
      const value = String(userId);
      if (selected.has(value)) selected.delete(value);
      else selected.add(value);
      return { ...prev, memberIds: [...selected] };
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await loadProjects();
      if (cancelled) return;
      setProjects(result.projectsData);
      setUsers(result.usersData);
      setTeams(result.teamsData);
      setDataSource(result.source);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [loadProjects]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!managerMenuRef.current?.contains(event.target)) {
        setIsManagerOpen(false);
      }
      if (!teamMenuRef.current?.contains(event.target)) {
        setIsTeamOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setCreateError('');
    const name = createForm.name.trim();
    const managerId = Number(createForm.managerId);
    if (!name) {
      setCreateError('Project name is required.');
      return;
    }
    if (!managerId) {
      setCreateError('Manager is required.');
      return;
    }
    if (!createForm.teamId) {
      setCreateError('Team is required.');
      return;
    }
    if (createForm.teamId === '__new__' && createForm.memberIds.length === 0) {
      setCreateError('Select at least one member for the new team.');
      return;
    }

    setIsCreating(true);
    try {
      const teamRes = await fetch('/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, managerId }),
      });
      if (!teamRes.ok) throw new Error('Could not create project.');

      const team = await teamRes.json();
      const memberIds =
        createForm.teamId === '__new__'
          ? new Set(createForm.memberIds.map((id) => Number(id)))
          : new Set(
              (teams.find((source) => String(source.id) === String(createForm.teamId))?.users || []).map(
                (member) => Number(member.id)
              )
            );
      memberIds.add(managerId);

      await Promise.all(
        [...memberIds]
          .filter(Boolean)
          .map((memberUserId) =>
            fetch('/team-members', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ teamId: team.id, memberUserId }),
            })
          )
      );

      const refreshed = await loadProjects();
      setProjects(refreshed.projectsData);
      setUsers(refreshed.usersData);
      setTeams(refreshed.teamsData);
      setDataSource(refreshed.source);
      setShowCreateModal(false);
      setIsManagerOpen(false);
      setIsTeamOpen(false);
      setCreateForm({ name: '', managerId: '', teamId: '', memberIds: [] });
    } catch (error) {
      setCreateError(error.message || 'Failed to create project.');
    } finally {
      setIsCreating(false);
    }
  };

  const stats = useMemo(() => summarizeProjects(projects), [projects]);
  const { active, completed } = useMemo(() => partitionProjects(projects), [projects]);

  if (loading) {
    return <DashboardProjectsSkeleton />;
  }

  return (
    <div className="dashboard-page-enter space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#2A1814]">Projects</h2>
          <p className="mt-1 text-sm text-[#6B6560]">
            Teams and workstreams from your workspace
            {dataSource === 'mock' && (
              <span className="ml-2 text-xs text-[#c74634]">(preview data — API unavailable)</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center rounded-full bg-[#2A1814] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d110e]"
        >
          New project
        </button>
      </div>

      <ProjectsKpiStrip stats={stats} />

      {projects.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#6B6560]">
          No projects yet. Create a team in the backend to see it listed here.
        </p>
      ) : (
        <div className="space-y-10">
          <ProjectListSection
            title="Active projects"
            count={active.length}
            projects={active}
            emptyMessage="No active projects right now."
          />
          <ProjectListSection
            title="Completed projects"
            count={completed.length}
            projects={completed}
            emptyMessage="No completed projects yet — finish all open tasks on a team to see it here."
          />
        </div>
      )}

      {showCreateModal && (
        <div className="dashboard-modal-overlay-enter fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="dashboard-modal-panel-enter w-full max-w-lg rounded-2xl border border-[#2A1814]/10 bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#2A1814]">Create new project</h3>
              <p className="mt-1 text-sm text-[#6B6560]">Set name, manager, and source team.</p>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-[#2a1814]/60">Project name</span>
                <span className="flex items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 focus-within:border-[#2a1814]">
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full border-0 bg-transparent text-sm text-[#2a1814] placeholder:text-[#2a1814]/35 focus:outline-none focus:ring-0"
                    placeholder="Core Platform"
                  />
                </span>
              </label>
              <label className="block" ref={managerMenuRef}>
                <span className="mb-2 block text-sm text-[#2a1814]/60">Manager</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsManagerOpen((prev) => !prev)}
                    className="flex w-full items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 text-left focus:border-[#2a1814] focus:outline-none"
                    aria-haspopup="listbox"
                    aria-expanded={isManagerOpen}
                  >
                    <span className="w-full text-sm text-[#2a1814]">
                      {createForm.managerId
                        ? users.find((u) => String(u.id) === String(createForm.managerId))?.name ||
                          users.find((u) => String(u.id) === String(createForm.managerId))?.email ||
                          `User ${createForm.managerId}`
                        : 'Select manager'}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#2a1814]/55" />
                  </button>
                  {isManagerOpen && (
                    <div className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#2A1814]/10 bg-white shadow-lg">
                      <ul role="listbox" className="py-1">
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setCreateForm((prev) => ({ ...prev, managerId: '' }));
                              setIsManagerOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-[#2A1814] hover:bg-[#faf9f6]"
                          >
                            Select manager
                          </button>
                        </li>
                        {users.map((user) => {
                          const value = String(user.id);
                          const active = String(createForm.managerId) === value;
                          return (
                            <li key={user.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setCreateForm((prev) => ({ ...prev, managerId: value }));
                                  setIsManagerOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm transition ${
                                  active ? 'bg-[#2A1814] text-white' : 'text-[#2A1814] hover:bg-[#faf9f6]'
                                }`}
                              >
                                {user.name || user.username || user.email || `User ${user.id}`}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </label>
              <label className="block" ref={teamMenuRef}>
                <span className="mb-2 block text-sm text-[#2a1814]/60">Team</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTeamOpen((prev) => !prev)}
                    className="flex w-full items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 text-left focus:border-[#2a1814] focus:outline-none"
                    aria-haspopup="listbox"
                    aria-expanded={isTeamOpen}
                  >
                    <span className="w-full text-sm text-[#2a1814]">
                      {createForm.teamId
                        ? createForm.teamId === '__new__'
                          ? 'Create new team'
                          : teams.find((team) => String(team.id) === String(createForm.teamId))?.name ||
                            `Team ${createForm.teamId}`
                        : 'Select team'}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#2a1814]/55" />
                  </button>
                  {isTeamOpen && (
                    <div className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#2A1814]/10 bg-white shadow-lg">
                      <ul role="listbox" className="py-1">
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setCreateForm((prev) => ({ ...prev, teamId: '', memberIds: [] }));
                              setIsTeamOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-[#2A1814] hover:bg-[#faf9f6]"
                          >
                            Select team
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setCreateForm((prev) => ({ ...prev, teamId: '__new__' }));
                              setIsTeamOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm transition ${
                              createForm.teamId === '__new__'
                                ? 'bg-[#2A1814] text-white'
                                : 'text-[#2A1814] hover:bg-[#faf9f6]'
                            }`}
                          >
                            Create new team
                          </button>
                        </li>
                        {teams.map((team) => {
                          const value = String(team.id);
                          const active = String(createForm.teamId) === value;
                          return (
                            <li key={team.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setCreateForm((prev) => ({ ...prev, teamId: value, memberIds: [] }));
                                  setIsTeamOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm transition ${
                                  active ? 'bg-[#2A1814] text-white' : 'text-[#2A1814] hover:bg-[#faf9f6]'
                                }`}
                              >
                                {team.name}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </label>
              {createForm.teamId === '__new__' && (
                <div>
                  <p className="mb-2 text-sm font-medium text-[#2A1814]">Select members for the new team</p>
                  <div className="max-h-44 overflow-y-auto rounded-xl border border-[#2A1814]/10">
                    {users.length === 0 && (
                      <p className="px-3 py-3 text-sm text-[#6B6560]">No users available.</p>
                    )}
                    {users.map((user) => {
                      const checked = createForm.memberIds.map(String).includes(String(user.id));
                      const label = user.name || user.username || user.email || `User ${user.id}`;
                      return (
                        <label
                          key={user.id}
                          className="flex cursor-pointer items-center justify-between gap-3 border-b border-[#2A1814]/[0.06] px-3 py-2.5 text-sm text-[#2A1814] last:border-b-0 hover:bg-[#faf9f6]"
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c74634]/15 text-[10px] font-semibold text-[#c74634]">
                              {initialsFromName(label)}
                            </span>
                            <span>{label}</span>
                          </span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                              checked
                                ? 'border-[#2A1814] bg-[#2A1814] text-white'
                                : 'border-[#2A1814]/25 bg-white text-transparent'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleMemberToggle(user.id)}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {createError && <p className="text-sm text-[#c74634]">{createError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full border border-[#2A1814]/15 px-4 py-2 text-sm font-medium text-[#2A1814]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-full bg-[#2A1814] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1d110e] disabled:opacity-70"
                >
                  {isCreating ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardProjects;

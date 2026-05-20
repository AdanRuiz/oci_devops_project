import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDashboardBundle } from './dashboardApi';
import { MOCK_SPRINTS, MOCK_TASKS, MOCK_TEAMS } from './dashboardMocks';
import { mapTeamsToProjects, partitionProjects, summarizeProjects } from './mapProjects';
import ProjectListSection from './ProjectListSection';
import ProjectsKpiStrip from './ProjectsKpiStrip';
import { DashboardProjectsSkeleton } from './DashboardSkeletons';

function DashboardProjects() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [dataSource, setDataSource] = useState('api');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    managerId: '',
    memberIds: [],
  });
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
      source,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await loadProjects();
      if (cancelled) return;
      setProjects(result.projectsData);
      setUsers(result.usersData);
      setDataSource(result.source);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [loadProjects]);

  const handleMemberToggle = (userId) => {
    setCreateForm((prev) => {
      const selected = new Set(prev.memberIds.map(String));
      const value = String(userId);
      if (selected.has(value)) selected.delete(value);
      else selected.add(value);
      return { ...prev, memberIds: [...selected] };
    });
  };

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

    setIsCreating(true);
    try {
      const teamRes = await fetch('/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, managerId }),
      });
      if (!teamRes.ok) throw new Error('Could not create project.');

      const team = await teamRes.json();
      const memberIds = new Set(createForm.memberIds.map((id) => Number(id)));
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
      setDataSource(refreshed.source);
      setShowCreateModal(false);
      setCreateForm({ name: '', managerId: '', memberIds: [] });
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
    <div className="space-y-10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#2A1814]/10 bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#2A1814]">Create new project</h3>
              <p className="mt-1 text-sm text-[#6B6560]">Set name, manager, and team members.</p>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#2A1814]">Project name</span>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-[#2A1814]/15 px-3 py-2 text-sm outline-none ring-[#c74634]/30 focus:ring"
                  placeholder="Core Platform"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#2A1814]">Manager</span>
                <select
                  value={createForm.managerId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, managerId: e.target.value }))}
                  className="w-full rounded-xl border border-[#2A1814]/15 px-3 py-2 text-sm outline-none ring-[#c74634]/30 focus:ring"
                >
                  <option value="">Select manager</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.username || user.email || `User ${user.id}`}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <p className="mb-2 text-sm font-medium text-[#2A1814]">Team members</p>
                <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-[#2A1814]/10 p-3">
                  {users.length === 0 && (
                    <p className="text-sm text-[#6B6560]">No users available.</p>
                  )}
                  {users.map((user) => {
                    const checked = createForm.memberIds.map(String).includes(String(user.id));
                    return (
                      <label key={user.id} className="flex items-center gap-2 text-sm text-[#2A1814]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleMemberToggle(user.id)}
                        />
                        {user.name || user.username || user.email || `User ${user.id}`}
                      </label>
                    );
                  })}
                </div>
              </div>
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

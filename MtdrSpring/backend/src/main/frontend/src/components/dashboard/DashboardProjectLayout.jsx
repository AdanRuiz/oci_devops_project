import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Chart as ChartJS, ArcElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { fetchDashboardBundle } from './dashboardApi';
import { MOCK_SPRINTS, MOCK_TASKS, MOCK_TEAMS } from './dashboardMocks';
import { mapTeamsToProjects } from './mapProjects';
import { DashboardProjectShellSkeleton } from './DashboardSkeletons';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function sprintNavClass({ isActive }) {
  const base =
    'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors border';
  return isActive
    ? `${base} border-[#2A1814]/15 bg-[#2A1814] text-white`
    : `${base} border-[#2A1814]/10 bg-white text-[#6B6560] hover:border-[#c74634]/30 hover:text-[#2A1814]`;
}

function DashboardProjectLayout() {
  const { projectId } = useParams();
  const id = Number(projectId);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [dataSource, setDataSource] = useState('api');
  const [localSprints, setLocalSprints] = useState([]);
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false);
  const [sprintForm, setSprintForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });
  const [sprintError, setSprintError] = useState('');
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const bundle = await fetchDashboardBundle();
      if (cancelled) return;

      let teamsData = bundle.teams;
      let tasksData = bundle.tasks;
      let sprintsData = bundle.sprints;
      let source = 'api';

      if (!bundle.teamsOk) {
        teamsData = MOCK_TEAMS;
        tasksData = bundle.tasksOk && bundle.tasks.length > 0 ? bundle.tasks : MOCK_TASKS;
        sprintsData = bundle.sprintsOk && bundle.sprints.length > 0 ? bundle.sprints : MOCK_SPRINTS;
        source = 'mock';
      }

      const projects = mapTeamsToProjects(teamsData, tasksData, sprintsData);
      const found = projects.find((p) => p.id === id) || null;

      setTasks(tasksData);
      setUsers(bundle.usersOk && Array.isArray(bundle.users) ? bundle.users : []);
      setProject(found);
      setDataSource(source);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    setLocalSprints([]);
  }, [id]);

  const teamTasks = useMemo(() => {
    if (!project) return [];
    const memberIds = new Set(project.members.map((m) => m.id));
    return tasks.filter((t) => memberIds.has(t.assignedTo));
  }, [project, tasks]);

  const sprintList = useMemo(() => {
    const byId = new Map();
    (project?.sprints || []).forEach((s) => byId.set(s.id, s));
    localSprints.forEach((s) => byId.set(s.id, s));
    return [...byId.values()].sort((a, b) => {
      const ta = new Date(a.startDate || 0).getTime();
      const tb = new Date(b.startDate || 0).getTime();
      if (ta !== tb) return ta - tb;
      return (a.id || 0) - (b.id || 0);
    });
  }, [project?.sprints, localSprints]);

  const outletContext = useMemo(
    () => ({
      project,
      teamTasks,
      orderedSprints: sprintList,
      users,
      dataSource,
    }),
    [project, teamTasks, sprintList, users, dataSource]
  );

  if (loading) {
    return <DashboardProjectShellSkeleton />;
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <Link
          to="/dashboard/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6B6560] hover:text-[#c74634]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
        <p className="text-sm text-[#6B6560]">Project not found.</p>
      </div>
    );
  }

  const handleCreateSprint = async (event) => {
    event.preventDefault();
    setSprintError('');
    if (!sprintForm.name.trim()) {
      setSprintError('Sprint name is required.');
      return;
    }
    if (!sprintForm.startDate || !sprintForm.endDate) {
      setSprintError('Start and end dates are required.');
      return;
    }
    if (new Date(sprintForm.startDate) > new Date(sprintForm.endDate)) {
      setSprintError('End date must be after start date.');
      return;
    }

    setIsCreatingSprint(true);
    try {
      const response = await fetch('/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sprintForm.name.trim(),
          startDate: sprintForm.startDate,
          endDate: sprintForm.endDate,
        }),
      });
      if (!response.ok) throw new Error('Could not create sprint.');
      const created = await response.json();
      setLocalSprints((prev) => [...prev, created]);
      setSprintForm({ name: '', startDate: '', endDate: '' });
      setShowCreateSprintModal(false);
    } catch (error) {
      setSprintError(error.message || 'Failed to create sprint.');
    } finally {
      setIsCreatingSprint(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/dashboard/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6B6560] hover:text-[#c74634]"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#2A1814]">{project.name}</h1>
            <p className="mt-1 text-sm text-[#6B6560]">
              Quality and delivery signals for this team
              {dataSource === 'mock' && (
                <span className="ml-2 text-xs text-[#c74634]">(preview data)</span>
              )}
            </p>
            {project.members?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {project.members.map((member) => (
                  <div key={member.id} className="inline-flex items-center gap-2 text-xs text-[#2A1814]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c74634]/15 text-[10px] font-semibold text-[#c74634]">
                      {member.initials}
                    </span>
                    {member.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-[#6B6560]">
              {project.openTasks} open · {project.doneTasks} done · {project.memberCount} members
            </p>
            <button
              type="button"
              onClick={() => setShowCreateSprintModal(true)}
              className="inline-flex items-center justify-center rounded-full bg-[#2A1814] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1d110e]"
            >
              New sprint
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-[#2A1814]/[0.08] pb-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#6B6560]">Sprints</p>
        <div className="flex flex-wrap items-center gap-2">
          <NavLink to={`/dashboard/projects/${project.id}`} end className={sprintNavClass}>
            Overview
          </NavLink>
          {sprintList.map((s) => (
            <NavLink
              key={s.id}
              to={`/dashboard/projects/${project.id}/sprints/${s.id}`}
              className={sprintNavClass}
            >
              {s.name || `Sprint ${s.id}`}
            </NavLink>
          ))}
          {sprintList.length === 0 && (
            <span className="text-sm text-[#6B6560]">
              No sprints linked to this team&apos;s tasks yet. Assign tasks to sprints in the developer app.
            </span>
          )}
        </div>
      </div>

      <Outlet context={outletContext} />

      {showCreateSprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2A1814]/10 bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#2A1814]">Create sprint</h3>
              <p className="mt-1 text-sm text-[#6B6560]">
                This creates a new sprint. You can assign tasks after creation.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleCreateSprint}>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#2A1814]">Sprint name</span>
                <input
                  type="text"
                  value={sprintForm.name}
                  onChange={(e) => setSprintForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-[#2A1814]/15 px-3 py-2 text-sm outline-none ring-[#c74634]/30 focus:ring"
                  placeholder="Sprint 15"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#2A1814]">Start</span>
                  <input
                    type="datetime-local"
                    value={sprintForm.startDate}
                    onChange={(e) =>
                      setSprintForm((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#2A1814]/15 px-3 py-2 text-sm outline-none ring-[#c74634]/30 focus:ring"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#2A1814]">End</span>
                  <input
                    type="datetime-local"
                    value={sprintForm.endDate}
                    onChange={(e) =>
                      setSprintForm((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#2A1814]/15 px-3 py-2 text-sm outline-none ring-[#c74634]/30 focus:ring"
                  />
                </label>
              </div>
              {sprintError && <p className="text-sm text-[#c74634]">{sprintError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateSprintModal(false)}
                  className="rounded-full border border-[#2A1814]/15 px-4 py-2 text-sm font-medium text-[#2A1814]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSprint}
                  className="rounded-full bg-[#2A1814] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1d110e] disabled:opacity-70"
                >
                  {isCreatingSprint ? 'Creating…' : 'Create sprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardProjectLayout;

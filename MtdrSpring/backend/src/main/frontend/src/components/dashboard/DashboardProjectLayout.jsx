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

  const teamTasks = useMemo(() => {
    if (!project) return [];
    const memberIds = new Set(project.members.map((m) => m.id));
    return tasks.filter((t) => memberIds.has(t.assignedTo));
  }, [project, tasks]);

  const outletContext = useMemo(
    () => ({
      project,
      teamTasks,
      orderedSprints: project?.sprints || [],
      users,
      dataSource,
    }),
    [project, teamTasks, users, dataSource]
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

  const sprintList = project.sprints || [];

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
          </div>
          <p className="text-xs text-[#6B6560]">
            {project.openTasks} open · {project.doneTasks} done · {project.memberCount} members
          </p>
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
    </div>
  );
}

export default DashboardProjectLayout;

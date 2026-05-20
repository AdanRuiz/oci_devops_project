import { useEffect, useMemo, useState } from 'react';
import { fetchDashboardBundle } from './dashboardApi';
import { MOCK_SPRINTS, MOCK_TASKS, MOCK_TEAMS } from './dashboardMocks';
import { mapTeamsToProjects, partitionProjects, summarizeProjects } from './mapProjects';
import ProjectListSection from './ProjectListSection';
import ProjectsKpiStrip from './ProjectsKpiStrip';
import { DashboardProjectsSkeleton } from './DashboardSkeletons';

function DashboardProjects() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [dataSource, setDataSource] = useState('api');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const bundle = await fetchDashboardBundle();

      if (cancelled) return;

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

      setProjects(mapTeamsToProjects(teams, tasks, sprints));
      setDataSource(source);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => summarizeProjects(projects), [projects]);
  const { active, completed } = useMemo(() => partitionProjects(projects), [projects]);

  if (loading) {
    return <DashboardProjectsSkeleton />;
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-[#2A1814]">Projects</h2>
        <p className="mt-1 text-sm text-[#6B6560]">
          Teams and workstreams from your workspace
          {dataSource === 'mock' && (
            <span className="ml-2 text-xs text-[#c74634]">(preview data — API unavailable)</span>
          )}
        </p>
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
    </div>
  );
}

export default DashboardProjects;

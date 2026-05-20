import { FolderKanban, ListTodo, Users } from 'lucide-react';
import DashboardKpiStrip from './DashboardKpiStrip';

function ProjectsKpiStrip({ stats }) {
  const items = [
    {
      icon: FolderKanban,
      label: 'Active',
      value: stats.activeProjects,
      trend:
        stats.activeProjects > 0
          ? {
              direction: 'up',
              label: `+${stats.openTasks || stats.activeProjects} tasks`,
            }
          : null,
    },
    {
      icon: Users,
      label: 'Members',
      value: stats.totalMembers,
      trend:
        stats.totalMembers > 0
          ? {
              direction: 'up',
              label: `+${stats.totalProjects} teams`,
            }
          : null,
    },
    {
      icon: ListTodo,
      label: 'Efficiency',
      value: `${stats.completionRate}%`,
      trend:
        stats.completionRate >= 50
          ? { direction: 'up', label: `+${stats.totalDone} done` }
          : stats.totalDone > 0
            ? { direction: 'down', label: `${stats.openTasks} open` }
            : null,
    },
  ];

  return <DashboardKpiStrip items={items} />;
}

export default ProjectsKpiStrip;

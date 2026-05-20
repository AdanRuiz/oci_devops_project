import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  buildBurndownDatasets,
  buildMemberBarDataset,
  burndownChartOptions,
  memberBarChartOptions,
} from './dashboardCharts';
import { fetchJsonSafe } from './dashboardApi';
import { MOCK_TASKS } from './dashboardMocks';
import ActivityListRow from './ActivityListRow';
import DashboardSection from './DashboardSection';
import { DashboardHomeSkeleton } from './DashboardSkeletons';
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const burndownLabels = ['20/04/26', '22/04/26', '24/04/26', '26/04/26', '28/04/26', '30/04/26'];
const burndownActual = [40, 32, 24, 16, 8, 0];
const burndownIdeal = [40, 32, 24, 16, 8, 0];

function ChartEmpty({ message }) {
  return (
    <div className="flex h-full min-h-[8rem] items-center justify-center px-4 text-center text-sm text-[#6B6560]">
      {message}
    </div>
  );
}

function buildMemberPoints(tasks, users) {
  const usersMap = {};
  users.forEach((u) => {
    usersMap[u.id] = u.name || u.username || `User ${u.id}`;
  });

  const totals = {};
  tasks
    .filter((t) => t.status === 'DONE')
    .forEach((t) => {
      const name = usersMap[t.assignedTo] || 'Unassigned';
      const first = name.split(' ')[0];
      totals[first] = (totals[first] || 0) + (t.storyPoints || t.hoursDone || 1);
    });

  const entries = Object.entries(totals);
  if (entries.length === 0) {
    return { labels: [], data: [] };
  }

  return {
    labels: entries.map(([name]) => name),
    data: entries.map(([, pts]) => pts),
  };
}

function buildActivity(tasks, users) {
  const usersMap = {};
  users.forEach((u) => {
    usersMap[u.id] = u.name || u.username || 'User';
  });

  const sorted = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .slice(0, 6);

  if (sorted.length === 0) {
    return [];
  }

  return sorted.map((t, i) => ({
    title: t.title || `User Task ${i + 1}`,
    detail: t.description?.slice(0, 40) || `Assigned to ${usersMap[t.assignedTo] || 'team'}`,
    time: 'Today',
  }));
}

function resolveTasksForHome(tasksResult) {
  if (tasksResult.ok && Array.isArray(tasksResult.data)) {
    return tasksResult.data;
  }
  if (!tasksResult.ok) {
    return MOCK_TASKS;
  }
  return [];
}

function DashboardHome() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasksFromApi, setTasksFromApi] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [tasksResult, usersResult] = await Promise.all([
        fetchJsonSafe('/tasks'),
        fetchJsonSafe('/users'),
      ]);

      if (!cancelled) {
        setTasks(resolveTasksForHome(tasksResult));
        setTasksFromApi(tasksResult.ok && (tasksResult.data?.length ?? 0) > 0);
        setUsers(usersResult.ok && Array.isArray(usersResult.data) ? usersResult.data : []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const memberChart = useMemo(() => buildMemberPoints(tasks, users), [tasks, users]);
  const activityItems = useMemo(() => buildActivity(tasks, users), [tasks, users]);

  const burndownData = useMemo(() => {
    if (tasksFromApi && tasks.length > 0) {
      const total = tasks.length;
      const done = tasks.filter((t) => t.status === 'DONE').length;
      const remaining = Math.max(total - done, 0);
      const steps = 6;
      const actual = Array.from({ length: steps }, (_, i) =>
        Math.round(remaining + ((done * (steps - 1 - i)) / (steps - 1 || 1)))
      );
      const ideal = Array.from({ length: steps }, (_, i) =>
        Math.round((remaining * (steps - 1 - i)) / (steps - 1 || 1))
      );
      return {
        labels: burndownLabels,
        datasets: buildBurndownDatasets(actual, ideal),
      };
    }
    return {
      labels: burndownLabels,
      datasets: buildBurndownDatasets(burndownActual, burndownIdeal),
    };
  }, [tasks, tasksFromApi]);

  const memberBarData = useMemo(
    () => buildMemberBarDataset(memberChart.labels, memberChart.data),
    [memberChart.labels, memberChart.data]
  );

  if (loading) {
    return <DashboardHomeSkeleton />;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="grid min-h-0 flex-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-12">
        <div className="flex min-h-0 flex-col gap-10">
          <DashboardSection
            title="Story Points this Sprint"
            subtitle="Burndown chart progression"
          >
            <div className="h-52 sm:h-60 [&_canvas]:bg-transparent">
              <Line data={burndownData} options={burndownChartOptions} />
            </div>
          </DashboardSection>

          <DashboardSection
            title="Story Points Completed per Member"
            subtitle="Individual performance tracking"
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-[10rem] flex-1 [&_canvas]:bg-transparent">
              {memberChart.labels.length > 0 ? (
                <Bar data={memberBarData} options={memberBarChartOptions} />
              ) : (
                <ChartEmpty message="No completed work to show yet." />
              )}
            </div>
          </DashboardSection>
        </div>

        <DashboardSection
          title="Recent Activity"
          className="flex min-h-0 flex-col lg:border-l lg:border-[#2A1814]/[0.08] lg:pl-10"
        >
          {activityItems.length === 0 ? (
            <ChartEmpty message="No recent activity." />
          ) : (
            <div className="min-h-0 flex-1">
              {activityItems.map((item, index) => (
                <ActivityListRow
                  key={item.title + item.detail}
                  item={item}
                  isLast={index === activityItems.length - 1}
                />
              ))}
            </div>
          )}
          <div className="mt-4 flex shrink-0 justify-center border-t border-[#2A1814]/[0.06] pt-4">
            <Link
              to="/dashboard/activity"
              className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-[#2A1814] px-10 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d110e]"
            >
              View all
            </Link>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}

export default DashboardHome;

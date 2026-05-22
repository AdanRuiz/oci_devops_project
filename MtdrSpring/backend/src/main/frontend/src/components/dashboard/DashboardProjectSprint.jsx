import { useMemo } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import moment from 'moment';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const priorityPalette = ['#c74634', '#e86b58', '#d8c995', '#efe7d4'];
const statusPalette = ['#c74634', '#e86b58', '#d8c995', '#efe7d4'];

const chartFont = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '66%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        pointStyle: 'circle',
        color: '#6B6560',
        font: { family: chartFont, size: 11 },
        padding: 12,
      },
    },
    tooltip: {
      backgroundColor: '#2A1814',
      titleColor: '#faf9f6',
      bodyColor: '#faf9f6',
      callbacks: {
        label: (ctx) => `${ctx.label}: ${ctx.raw}%`,
      },
    },
  },
};

const velocityOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        pointStyle: 'circle',
        color: '#6B6560',
        font: { family: chartFont, size: 12 },
      },
    },
    tooltip: {
      backgroundColor: '#2A1814',
      titleColor: '#faf9f6',
      bodyColor: '#faf9f6',
      callbacks: {
        label: (ctx) => `Tasks Done: ${ctx.raw}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#8a8580', font: { family: chartFont, size: 11 } },
    },
    y: {
      beginAtZero: true,
      ticks: { color: '#8a8580', font: { family: chartFont, size: 11 }, stepSize: 1 },
      border: { display: false },
      grid: { color: 'rgba(42,24,20,0.06)', drawTicks: false },
    },
  },
};

function percentageBreakdown(total, counts) {
  if (total === 0) return counts.map(() => 0);
  return counts.map((value) => Math.round((value / total) * 100));
}

function buildPriorityData(rows) {
  const counts = {
    CRITICAL: rows.filter((t) => t.priority === 'CRITICAL').length,
    HIGH: rows.filter((t) => t.priority === 'HIGH').length,
    MEDIUM: rows.filter((t) => t.priority === 'MEDIUM').length,
    LOW: rows.filter((t) => t.priority === 'LOW').length,
  };
  const total = rows.length;
  const data = percentageBreakdown(total, [
    counts.CRITICAL,
    counts.HIGH,
    counts.MEDIUM,
    counts.LOW,
  ]);
  return {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{ data, backgroundColor: priorityPalette, borderWidth: 0, hoverOffset: 4 }],
  };
}

function buildStatusData(rows) {
  const counts = {
    BACKLOG: rows.filter((t) => t.status === 'PENDING').length,
    TODO: rows.filter((t) => t.status === 'TODO').length,
    IN_PROGRESS: rows.filter((t) => t.status === 'IN_PROGRESS').length,
    DONE: rows.filter((t) => t.status === 'DONE').length,
  };
  const total = rows.length;
  const data = percentageBreakdown(total, [
    counts.BACKLOG,
    counts.TODO,
    counts.IN_PROGRESS,
    counts.DONE,
  ]);
  return {
    labels: ['Backlog', 'To Do', 'In Progress', 'Done'],
    datasets: [{ data, backgroundColor: statusPalette, borderWidth: 0, hoverOffset: 4 }],
  };
}

function buildVelocityData(rows, sprint) {
  const start = sprint?.startDate ? moment(sprint.startDate) : moment().subtract(6, 'day');
  const end = sprint?.endDate ? moment(sprint.endDate) : moment();
  const dayCount = Math.max(end.diff(start, 'days') + 1, 1);
  const labels = Array.from({ length: dayCount }, (_, i) =>
    start.clone().add(i, 'day').format('DD/MM')
  );
  const donePerDay = labels.map((_, idx) => {
    const dayStart = start.clone().add(idx, 'day').startOf('day');
    const dayEnd = dayStart.clone().endOf('day');
    return rows.filter((task) => {
      if (task.status !== 'DONE') return false;
      const date = task.completedDate || task.updatedAt || task.createdAt;
      if (!date) return false;
      const m = moment(date);
      return m.isBetween(dayStart, dayEnd, null, '[]');
    }).length;
  });

  return {
    labels,
    datasets: [
      {
        label: 'Tasks Done',
        data: donePerDay,
        backgroundColor: '#c74634',
        borderRadius: 6,
        barThickness: 28,
        maxBarThickness: 34,
      },
    ],
  };
}

function DashboardProjectSprint() {
  const { sprintId } = useParams();
  const sid = Number(sprintId);
  const { project, teamTasks, orderedSprints } = useOutletContext();

  const sprint = useMemo(
    () => orderedSprints.find((s) => s.id === sid) || null,
    [orderedSprints, sid]
  );

  const rows = useMemo(
    () => teamTasks.filter((t) => t.sprint?.id === sid),
    [teamTasks, sid]
  );

  const priorityData = useMemo(() => buildPriorityData(rows), [rows]);
  const statusData = useMemo(() => buildStatusData(rows), [rows]);
  const velocityData = useMemo(() => buildVelocityData(rows, sprint), [rows, sprint]);

  if (!sprint) {
    return (
      <div className="rounded-2xl border border-[#2A1814]/[0.06] bg-[#faf9f6] p-8 text-center">
        <p className="text-sm text-[#6B6560]">This sprint is not part of this project.</p>
        <Link
          to={`/dashboard/projects/${project.id}`}
          className="mt-4 inline-block text-sm font-medium text-[#c74634] hover:underline"
        >
          Back to overview
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#2A1814]/[0.06] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#2A1814]">{sprint.name || `Sprint ${sprint.id}`}</h2>
            <p className="mt-1 text-sm text-[#6B6560]">
              {sprint.startDate && `Start ${moment(sprint.startDate).format('MMM D, YYYY')}`}
              {sprint.endDate && ` · End ${moment(sprint.endDate).format('MMM D, YYYY')}`}
            </p>
          </div>
          <span className="rounded-full bg-[#faf9f6] px-3 py-1 text-sm text-[#6B6560] ring-1 ring-[#2A1814]/8">
            {rows.length} tasks in sprint
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#2A1814]/[0.06] bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-sm font-semibold text-[#2A1814]">Sprint Task Priority</h3>
          <div className="mx-auto mt-4 h-52 w-full max-w-[260px] [&_canvas]:bg-transparent">
            <Doughnut data={priorityData} options={doughnutOptions} />
          </div>
        </div>
        <div className="rounded-2xl border border-[#2A1814]/[0.06] bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-sm font-semibold text-[#2A1814]">Sprint Tasks</h3>
          <div className="mx-auto mt-4 h-52 w-full max-w-[260px] [&_canvas]:bg-transparent">
            <Doughnut data={statusData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#2A1814]/[0.06] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#2A1814]">Sprint Velocity</h3>
          <p className="mt-1 text-xs text-[#6B6560]">Tasks completed per day</p>
        </div>
        <div className="h-72 [&_canvas]:bg-transparent">
          <Bar data={velocityData} options={velocityOptions} />
        </div>
        {rows.length === 0 && (
          <p className="mt-3 text-center text-sm text-[#6B6560]">
            No tasks assigned to this sprint yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default DashboardProjectSprint;

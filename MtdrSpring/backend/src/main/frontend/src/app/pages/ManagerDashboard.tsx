import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Clock, ListTodo, AlertCircle, Folder } from 'lucide-react';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import KanbanBoard from '../components/KanbanBoard';
import TeamPerformanceChart from '../components/TeamPerformanceChart';
import HoursWorkedChart from '../components/HoursWorkedChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  BackendTask,
  DeveloperSummary,
  buildDeveloperMetricsFromBackend,
  buildFrontendTasks,
  fetchDeveloperSummaries,
  fetchTasks,
  getStats,
} from '../api/taskDataApi';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);
  const [developers, setDevelopers] = useState<DeveloperSummary[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksData, developersData] = await Promise.all([fetchTasks(), fetchDeveloperSummaries()]);
        setBackendTasks(tasksData);
        setDevelopers(developersData);
        setError(null);
      } catch {
        setError('Could not load dashboard data from database');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const sprintOptions = useMemo(
    () => Array.from(new Set([0, ...backendTasks.map((task) => task.sprint).filter((s): s is number => s !== undefined)])).sort((a, b) => a - b),
    [backendTasks],
  );

  const filteredBackendTasks = useMemo(
    () => selectedSprint === 'all'
      ? backendTasks
      : backendTasks.filter((task) => task.sprint === Number(selectedSprint)),
    [backendTasks, selectedSprint],
  );

  const tasks = useMemo(() => buildFrontendTasks(filteredBackendTasks, developers), [filteredBackendTasks, developers]);
  const devMetrics = useMemo(
    () => buildDeveloperMetricsFromBackend(filteredBackendTasks, developers),
    [filteredBackendTasks, developers],
  );
  const stats = useMemo(() => getStats(tasks), [tasks]);

  // Sprint values are zero-based in the data, so 0, 1, 2 means we are on sprint 3.
  const currentSprint = backendTasks.length > 0
    ? Math.max(...backendTasks.map((task) => task.sprint ?? 0)) + 1
    : 1;
  const sprintDivisor = selectedSprint === 'all' ? currentSprint : 1;

  // Group tasks by developer and calculate totals for the active filter scope
  const devTaskTotals = new Map<string, { completedTasks: number; hours: number }>();
  filteredBackendTasks.forEach((task) => {
    const devId = String(task.developerID);
    if (!devTaskTotals.has(devId)) {
      devTaskTotals.set(devId, { completedTasks: 0, hours: 0 });
    }
    const current = devTaskTotals.get(devId)!;
    if (task.status === 'closed') {
      current.completedTasks += 1;
    }
    current.hours += task.timeSpent || 0;
  });

  // Calculate averages per sprint
  const devAvgTasks = developers.map((dev) => {
    const totals = devTaskTotals.get(dev.id) || { completedTasks: 0, hours: 0 };
    const avgPerSprint = (totals.completedTasks / sprintDivisor).toFixed(1);
    return { name: dev.name, avg: avgPerSprint };
  });
  const overallAvgTasks = devAvgTasks.length > 0
    ? (devAvgTasks.reduce((sum, d) => sum + parseFloat(d.avg), 0) / devAvgTasks.length).toFixed(1)
    : '0.0';

  const devAvgHours = developers.map((dev) => {
    const totals = devTaskTotals.get(dev.id) || { completedTasks: 0, hours: 0 };
    const avgPerSprint = (totals.hours / sprintDivisor).toFixed(1);
    return { name: dev.name, avg: avgPerSprint };
  });
  const overallAvgHours = devAvgHours.length > 0
    ? (devAvgHours.reduce((sum, d) => sum + parseFloat(d.avg), 0) / devAvgHours.length).toFixed(1)
    : '0.0';

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
 

  const handleTaskClick = (taskId: string) => {
    navigate(`/developer/task/${taskId}`);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-600">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-slate-50 p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Manager Dashboard"
        subtitle="Monitor team progress and track project metrics"
        userName="Monserrat Morales"
        userInitials="MM"
      />

      <main className="p-6">
        <div className="flex items-center justify-end mb-4">
          <Select value={selectedSprint} onValueChange={setSelectedSprint}>
            <SelectTrigger size="sm" className="!w-[130px] text-sm">
              <SelectValue placeholder="Select sprint" />
            </SelectTrigger>
            <SelectContent className="min-w-[130px]">
              <SelectItem value="all">All Sprints</SelectItem>
              {sprintOptions.map((sprint) => (
                <SelectItem key={sprint} value={String(sprint)}>
                  {`Sprint ${sprint}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-5 gap-4 mb-5">
          <StatsCard
            title="Total Tasks"
            value={stats.total}
            icon={Folder}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatsCard
            title="Pending"
            value={stats.todo}
            icon={ListTodo}
            iconColor="text-slate-600"
            iconBgColor="bg-slate-100"
          />
          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            icon={Clock}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
          <StatsCard
            title="Completed"
            value={stats.done}
            icon={CheckCircle2}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatsCard
            title="High Priority"
            value={stats.highPriority}
            icon={AlertCircle}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
          />
        </div>

        {/* Sprint Progress + Team Overview */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200 mb-5">
          <h3 className="text-slate-900 mb-3">Sprint Progress</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-xl text-slate-900 mb-1">
                {completionRate}%
              </p>
              <p className="text-sm text-slate-600">Completion Rate</p>
            </div>
            
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Completed Tasks per Developer */}
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Average Tasks / Sprint</p>
                <span className="text-xs text-slate-500">Team avg: {overallAvgTasks}</span>
              </div>
              <div className="space-y-1.5">
                {devAvgTasks.map((dev) => (
                  <div key={dev.name} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{dev.name}</span>
                    <span className="text-sm text-slate-900">{dev.avg} tasks</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Logged Hours per Developer */}
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Average Hours / Sprint</p>
                <span className="text-xs text-slate-500">Team avg: {overallAvgHours}h</span>
              </div>
              <div className="space-y-1.5">
                {devAvgHours.map((dev) => (
                  <div key={dev.name} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{dev.name}</span>
                    <span className="text-sm text-slate-900">{dev.avg}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team Performance Charts */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <TeamPerformanceChart
            data={devMetrics.map((dev) => ({
              name: dev.name,
              assigned: dev.assignedTasksCount,
              completed: dev.completedTasksCount,
            }))}
          />
          <HoursWorkedChart
            data={devMetrics.map((dev) => ({
              name: dev.name,
              hoursWorked: dev.hoursWorked,
            }))}
          />
        </div>

        {/* Kanban Board */}
        <KanbanBoard tasks={tasks} onTaskClick={handleTaskClick} />
      </main>
    </div>
  );
}

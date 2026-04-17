import { developers } from '../data/mockData';
import { Users, CheckCircle2, Clock } from 'lucide-react';

export default function TeamOverview() {
  const totalTasks = developers.reduce((sum, dev) => sum + dev.assignedTasksCount, 0);
  const totalHours = developers.reduce((sum, dev) => sum + dev.hoursWorked, 0);
  const totalCompleted = developers.reduce((sum, dev) => sum + dev.completedTasksCount, 0);

  const avgTasksPerDev = (totalTasks / developers.length).toFixed(1);
  const avgHoursPerDev = (totalHours / developers.length).toFixed(1);
  const avgCompletedPerDev = (totalCompleted / developers.length).toFixed(1);

  return (
    <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-red-600" />
        <h3 className="text-slate-900">Team Overview</h3>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center gap-3 mb-1">
            <CheckCircle2 className="w-4 h-4 text-red-600" />
            <p className="text-sm text-slate-600">Avg Tasks / Developer</p>
          </div>
          <p className="text-2xl text-slate-900 ml-7">{avgTasksPerDev}</p>
          <p className="text-xs text-slate-500 ml-7 mt-0.5">
            {avgCompletedPerDev} completed on average
          </p>
        </div>

        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center gap-3 mb-1">
            <Clock className="w-4 h-4 text-red-700" />
            <p className="text-sm text-slate-600">Avg Hours / Developer</p>
          </div>
          <p className="text-2xl text-slate-900 ml-7">{avgHoursPerDev}h</p>
          <p className="text-xs text-slate-500 ml-7 mt-0.5">
            {totalHours}h total across team
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            {developers.length} developers • {totalTasks} total tasks
          </p>
        </div>
      </div>
    </div>
  );
}

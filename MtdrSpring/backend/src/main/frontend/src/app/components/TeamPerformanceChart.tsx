interface TeamPerformanceItem {
  name: string;
  assigned: number;
  completed: number;
}

interface TeamPerformanceChartProps {
  data: TeamPerformanceItem[];
}

export default function TeamPerformanceChart({ data }: TeamPerformanceChartProps) {

  const maxTasks = Math.max(...data.map(d => d.assigned), 1);

  return (
    <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200">
      <h3 className="text-slate-900 mb-3">Tasks Completed per Developer</h3>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">Completed vs Total assigned tasks </p>
      </div>

      <div className="space-y-4">
        {data.map((dev) => (
          <div key={dev.name}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-slate-700">{dev.name}</p>
              <span className="text-xs text-slate-600">
                {dev.completed}/{dev.assigned} tasks
              </span>
            </div>
            <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
              <div
                className="h-full bg-blue-400/85 rounded-lg flex items-center justify-end pr-3 transition-all duration-500"
                style={{ width: `${(dev.completed / maxTasks) * 100}%` }}
              >
                <span className="text-white text-sm font-medium">{dev.completed}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-400/85"></div>
          <span className="text-sm text-slate-600">Completed Tasks</span>
        </div>
      </div>
    </div>
  );
}

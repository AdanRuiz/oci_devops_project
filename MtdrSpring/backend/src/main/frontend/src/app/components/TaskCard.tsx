import { Calendar, User } from 'lucide-react';
import { Task, Priority } from '../api/taskDataApi';
import { Badge } from './ui/badge';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  showAssignee?: boolean;
}

const priorityConfig: Record<Priority, { color: string; bgColor: string; label: string }> = {
  high: { color: 'text-red-700', bgColor: 'bg-red-100 border-red-200', label: 'High Priority' },
  medium: { color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-200', label: 'Medium' },
  low: { color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-200', label: 'Low' },
};

export default function TaskCard({ task, onClick, showAssignee = false }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm text-slate-900 leading-snug pr-2 group-hover:text-primary transition-colors">{task.title}</h4>
        {task.priority === 'high' }
      </div>

      {task.description && <p className="text-xs text-slate-600 mb-3 line-clamp-2">{task.description}</p>}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {task.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 border-0">{tag}</Badge>
        ))}
        {task.tags.length > 2 && <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 border-0">+{task.tags.length - 2}</Badge>}
      </div>

      <div className="space-y-2">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs ${priority.bgColor} ${priority.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${priority.color.replace('text-', 'bg-')}`} />
          {priority.label}
        </div>

        {showAssignee && task.assignedDeveloper && (
          <div className="flex items-center gap-2 text-xs text-slate-600"><User className="w-3.5 h-3.5" /><span>{task.assignedDeveloper.name}</span></div>
        )}

        <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
          <Calendar className="w-3.5 h-3.5" />
          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          {isOverdue && <span className="text-red-600">(Overdue)</span>}
        </div>
      </div>
    </div>
  );
}

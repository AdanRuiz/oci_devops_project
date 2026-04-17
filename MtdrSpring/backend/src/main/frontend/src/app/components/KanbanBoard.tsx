import { Task, Status } from '../api/taskDataApi';
import TaskCard from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  showAssignee?: boolean;
}

const columns: { status: Status; title: string; bgColor: string }[] = [
  { status: 'todo', title: 'To Do', bgColor: 'bg-slate-50' },
  { status: 'in-progress', title: 'In Progress', bgColor: 'bg-blue-50' },
  { status: 'done', title: 'Done', bgColor: 'bg-green-50' },
];

export default function KanbanBoard({ tasks, onTaskClick, showAssignee = false }: KanbanBoardProps) {
  const getTasksByStatus = (status: Status) => tasks.filter((task) => task.status === status);

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.status);
        return (
          <div key={column.status} className="flex flex-col">
            <div className="mb-4">
              <div className={`rounded-lg px-4 py-3 ${column.bgColor} border border-slate-200`}>
                <h3 className="text-slate-900">{column.title}</h3>
                <p className="text-sm text-slate-600">{columnTasks.length} tasks</p>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} showAssignee={showAssignee} />
              ))}
              {columnTasks.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No tasks in this column</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

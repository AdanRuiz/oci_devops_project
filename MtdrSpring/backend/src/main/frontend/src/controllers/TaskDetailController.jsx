import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { useTask, useTaskHistory, useTaskWorkLogs } from '../models/hooks/useTasks';
import TaskDetailView from '../views/tasks/TaskDetailView';

export default function TaskDetailController() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const { data: task, isLoading } = useTask(taskId);
  const { data: history = [] } = useTaskHistory(taskId);
  const { data: logs = [] } = useTaskWorkLogs(taskId);

  if (isLoading) return <CircularProgress />;

  return <TaskDetailView task={task} history={history} logs={logs} onBack={() => navigate(-1)} />;
}

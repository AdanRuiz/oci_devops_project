import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { useSprint } from '../models/hooks/useSprints';
import {
  useSprintTasks,
  useUpdateTaskStatus,
  useCreateTask,
  useLogWork,
} from '../models/hooks/useTasks';
import { useMembers } from '../models/hooks/useMembers';
import { useActiveProject } from '../models/ProjectContext';
import SprintBoardView from '../views/sprints/SprintBoardView';

export default function SprintBoardController() {
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const { activeProject } = useActiveProject();

  const { data: sprint, isLoading: loadingSprint } = useSprint(sprintId);
  const { data: tasks = [], isLoading: loadingTasks } = useSprintTasks(sprintId);
  const { data: members = [] } = useMembers(projectId);
  const updateStatus = useUpdateTaskStatus(sprintId);
  const createTask = useCreateTask(sprintId);
  const logWork = useLogWork();

  if (loadingSprint || loadingTasks) return <CircularProgress />;

  return (
    <SprintBoardView
      sprint={sprint}
      tasks={tasks}
      members={members}
      projectId={projectId}
      onBack={() => navigate(`/projects/${projectId}`)}
      onTaskSelect={(taskId) => navigate(`/tasks/${taskId}`)}
      onStatusChange={(taskId, status, changedById) =>
        updateStatus.mutate({ taskId, status, changedById })
      }
      onCreateTask={(payload) => createTask.mutateAsync(payload)}
      onLogWork={(taskId, payload) => logWork.mutateAsync({ taskId, ...payload })}
    />
  );
}

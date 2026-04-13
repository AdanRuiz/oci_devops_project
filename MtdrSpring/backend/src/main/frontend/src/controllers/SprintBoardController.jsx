import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { useSprint } from '../models/hooks/useSprints';
import { useSprintTasks } from '../models/hooks/useTasks';
import SprintBoardView from '../views/sprints/SprintBoardView';

export default function SprintBoardController() {
    const { projectId, sprintId } = useParams();
    const navigate = useNavigate();

    const { data: sprint, isLoading: loadingSprint } = useSprint(sprintId);
    const { data: tasks = [], isLoading: loadingTasks } = useSprintTasks(sprintId);

    if (loadingSprint || loadingTasks) return <CircularProgress />;

    return (
        <SprintBoardView
            sprint={sprint}
            tasks={tasks}
            onBack={() => navigate(`/projects/${projectId}`)}
            onTaskSelect={(taskId) => navigate(`/tasks/${taskId}`)}
        />
    );
}

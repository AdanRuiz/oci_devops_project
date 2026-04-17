import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveProject } from '../models/ProjectContext';
import { useSprints } from '../models/hooks/useSprints';
import { useSprintTasks } from '../models/hooks/useTasks';
import { useUsers } from '../models/hooks/useUsers';
import KanbanView from '../views/kanban/KanbanView';

const STORAGE_KEY = 'kanbanSelectedSprintId';

export default function KanbanBoardController() {
    const navigate = useNavigate();
    const { activeProject } = useActiveProject();
    const projectId = activeProject?.id;

    const [sprintId, setSprintId] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');

    const { data: sprints = [] } = useSprints(projectId);
    const { data: tasks = [], isLoading: isTasksLoading } = useSprintTasks(sprintId);
    const { data: users = [], isLoading: isUsersLoading } = useUsers();

    const handleSprintChange = (id) => {
        setSprintId(id);
        localStorage.setItem(STORAGE_KEY, id);
    };

    return (
        <KanbanView
            projectName={activeProject?.name}
            sprints={sprints}
            sprintId={sprintId}
            users={users}
            tasks={tasks}
            isLoading={isTasksLoading || isUsersLoading}
            onSprintChange={handleSprintChange}
            onTaskSelect={(taskId) => navigate(`/tasks/${taskId}`)}
        />
    );
}

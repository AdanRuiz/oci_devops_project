import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveProject } from '../models/ProjectContext';
import { useSprints } from '../models/hooks/useSprints';
import { useSprintTasks } from '../models/hooks/useTasks';
import { useMembers } from '../models/hooks/useMembers';
import KanbanView from '../views/kanban/KanbanView';

const STORAGE_KEY = 'kanbanSelectedSprintId';

function pickDefaultSprint(sprints) {
    if (!sprints.length) return null;
    return sprints.find(s => s.status === 'ACTIVE')
        ?? sprints.find(s => s.status === 'UPCOMING')
        ?? sprints[sprints.length - 1];
}

export default function KanbanBoardController() {
    const navigate = useNavigate();
    const { activeProject } = useActiveProject();
    const projectId = activeProject?.id;

    const [sprintId, setSprintId] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');

    const { data: sprints = [] } = useSprints(projectId);
    const { data: tasks = [], isLoading: isTasksLoading } = useSprintTasks(sprintId);
    const { data: members = [], isLoading: isMembersLoading } = useMembers(projectId);

    // Clear stored sprint when switching projects so stale data isn't shown
    useEffect(() => {
        setSprintId('');
        localStorage.removeItem(STORAGE_KEY);
    }, [projectId]);

    // Auto-select a sprint when sprints load and none is selected
    useEffect(() => {
        if (sprintId || !sprints.length) return;
        const defaultSprint = pickDefaultSprint(sprints);
        if (defaultSprint) {
            setSprintId(defaultSprint.id);
            localStorage.setItem(STORAGE_KEY, defaultSprint.id);
        }
    }, [sprints, sprintId]);
    const users = members.map(m => m.user).filter(Boolean);

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
            isLoading={isTasksLoading || isMembersLoading}
            onSprintChange={handleSprintChange}
            onTaskSelect={(taskId) => navigate(`/tasks/${taskId}`)}
        />
    );
}

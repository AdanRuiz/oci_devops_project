import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardView from '../views/dashboard/DashboardView';
import { useCurrentUser } from '../models/CurrentUserContext';
import { useActiveProject } from '../models/ProjectContext';
import { useSprints } from '../models/hooks/useSprints';
import { useSprintTasks } from '../models/hooks/useTasks';
import { useKpi } from '../models/hooks/useKpi';

function pickActiveSprint(sprints = []) {
    if (!sprints.length) return null;
    const active = sprints.find(s => s.status === 'ACTIVE');
    if (active) return active;
    // Fall back to most recently started sprint
    return [...sprints].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
}

export default function DashboardController() {
    const navigate = useNavigate();
    const { currentUser } = useCurrentUser();
    const { activeProject } = useActiveProject();

    const projectId = activeProject?.id ?? null;
    const projectName = activeProject?.name ?? 'No Project Selected';

    const { data: sprints = [] } = useSprints(projectId);
    const activeSprint = useMemo(() => pickActiveSprint(sprints), [sprints]);
    const activeSprintId = activeSprint?.id ?? null;

    const { data: tasks = [] } = useSprintTasks(activeSprintId);
    const { data: kpi } = useKpi(activeSprintId);

    const stats = useMemo(() => {
        const openTasks  = tasks.filter(t => t.status !== 'DONE').length;
        const completed  = tasks.filter(t => t.status === 'DONE').length;
        const blocked    = tasks.filter(t => t.status === 'BLOCKED').length;
        const avgCycleTime   = kpi?.avgCycleTimeDays ?? 0;
        const cycleTimeChange = kpi?.cycleTimeChangePct ?? 0;
        return { openTasks, projectCount: projectId ? 1 : 0, completed, blocked, avgCycleTime, cycleTimeChange };
    }, [tasks, kpi, projectId]);

    const projectSprints = useMemo(() => {
        if (!activeSprint || !projectId) return [];
        return [{
            projectId,
            projectName,
            sprintName: activeSprint.name ?? activeSprint.sprintName ?? 'Sprint',
            todo:       tasks.filter(t => t.status === 'TODO').length,
            inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
            blocked:    tasks.filter(t => t.status === 'BLOCKED').length,
            done:       tasks.filter(t => t.status === 'DONE').length,
        }];
    }, [activeSprint, projectId, projectName, tasks]);

    const myTasks = useMemo(() => {
        if (!currentUser) return [];
        return tasks.filter(t => t.assignee?.id === currentUser.id);
    }, [tasks, currentUser]);

    const userName = currentUser?.email?.split('@')[0] ?? 'there';
    const activeSprintName = activeSprint?.name ?? activeSprint?.sprintName ?? 'the active sprint';

    return (
        <DashboardView
            userName={userName}
            activeSprintName={activeSprintName}
            stats={stats}
            projectSprints={projectSprints}
            myTasks={myTasks}
            onViewBoard={() => navigate('/projects')}
        />
    );
}

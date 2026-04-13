import { useNavigate } from 'react-router-dom';
import DashboardView from '../views/dashboard/DashboardView';

// TODO: Replace mock data with real API calls once backend endpoints are ready
const MOCK_STATS = {
    openTasks:       6,
    projectCount:    3,
    completed:       3,
    blocked:         1,
    avgCycleTime:    2.1,
    cycleTimeChange: 18,
};

const MOCK_PROJECT_SPRINTS = [
    {
        projectId:   1,
        projectName: 'Cloud PM Tool',
        sprintName:  'Sprint 3',
        todo:        1,
        inProgress:  3,
        blocked:     1,
        done:        4,
    },
    {
        projectId:   2,
        projectName: 'Auth Microservice',
        sprintName:  'Sprint 2',
        todo:        1,
        inProgress:  3,
        blocked:     3,
        done:        3,
    },
];

const MOCK_MY_TASKS = [
    { id: 1, title: 'Monorepo project structure setup', status: 'DONE' },
];

export default function DashboardController() {
    const navigate = useNavigate();

    return (
        <DashboardView
            userName="Baltazar"
            activeSprintName="Sprint 3"
            stats={MOCK_STATS}
            projectSprints={MOCK_PROJECT_SPRINTS}
            myTasks={MOCK_MY_TASKS}
            onViewBoard={() => navigate('/projects')}
        />
    );
}

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardView from '../views/dashboard/DashboardView';

const BASE_STATS = {
    openTasks: 5,
    projectCount: 1,
    completed: 3,
    blocked: 1,
    avgCycleTime: 2.5,
    cycleTimeChange: 10,
};

const BASE_PROPS = {
    userName: 'jane.doe',
    activeSprintName: 'Sprint 3',
    stats: BASE_STATS,
    projectSprints: [],
    myTasks: [],
};

describe('R1 - My Tasks: real-time display of tasks assigned to the current user', () => {
    function getMyTasksSection() {
        return screen.getByTestId('my-tasks-section');
    }

    test('renders each task title inside the My Tasks section', () => {
        const myTasks = [
            { id: '1', title: 'Design login screen', status: 'IN_PROGRESS' },
            { id: '2', title: 'Fix null-pointer bug', status: 'TODO' },
        ];
        render(<DashboardView {...BASE_PROPS} myTasks={myTasks} />);

        const section = getMyTasksSection();
        expect(within(section).getByText('Design login screen')).toBeInTheDocument();
        expect(within(section).getByText('Fix null-pointer bug')).toBeInTheDocument();
    });

    test('shows the correct status badge inside My Tasks (not in KPI cards)', () => {
        const myTasks = [
            { id: '1', title: 'Task A', status: 'IN_PROGRESS' },
            { id: '2', title: 'Task B', status: 'DONE' },
            { id: '3', title: 'Task C', status: 'TODO' },
        ];
        render(<DashboardView {...BASE_PROPS} myTasks={myTasks} />);

        const section = getMyTasksSection();
        expect(within(section).getByText('In Progress')).toBeInTheDocument();
        expect(within(section).getByText('Done')).toBeInTheDocument();
        expect(within(section).getByText('To Do')).toBeInTheDocument();
    });

    test('shows empty-state message inside My Tasks when no tasks are assigned', () => {
        render(<DashboardView {...BASE_PROPS} myTasks={[]} />);
        const section = getMyTasksSection();
        expect(
            within(section).getByText('No tasks assigned to you.')
        ).toBeInTheDocument();
    });
});


describe('R6 - Team KPIs: stat cards showing team-level metrics', () => {

    function getKpiCards() { 
        return screen.getByTestId('kpi-stat-cards'); 
    }
    function getSprintHealthSection() { 
        return screen.getByTestId('sprint-health-section'); 
    }

    test('renders all four KPI card labels', () => {
        render(<DashboardView {...BASE_PROPS} />);

        const cards = getKpiCards();
        expect(within(cards).getByText('Open Tasks')).toBeInTheDocument();
        expect(within(cards).getByText('Completed')).toBeInTheDocument();
        expect(within(cards).getByText('Blocked')).toBeInTheDocument();
        expect(within(cards).getByText('Avg cycle time')).toBeInTheDocument();
    });

    test('stat cards display the correct numeric values', () => {
        render(<DashboardView {...BASE_PROPS} />);

        const cards = getKpiCards();
        expect(within(cards).getByText('5')).toBeInTheDocument();        // openTasks
        expect(within(cards).getByText('3')).toBeInTheDocument();        // completed
        expect(within(cards).getByText('1')).toBeInTheDocument();        // blocked
        expect(within(cards).getByText('2.5 days')).toBeInTheDocument(); // avgCycleTime
    });

    test('shows no-active-sprints message when projectSprints is empty', () => {
        render(<DashboardView {...BASE_PROPS} projectSprints={[]} />);
        expect(
            within(getSprintHealthSection()).getByText('No active sprints.')
        ).toBeInTheDocument();
    });
});

describe('Mock function - onViewBoard callback', () => {
    test('onViewBoard spy is not called on initial render', () => {
        const onViewBoard = jest.fn();
        render(<DashboardView {...BASE_PROPS} onViewBoard={onViewBoard} />);
        expect(onViewBoard).not.toHaveBeenCalled();
    });
});

describe('Snapshot', () => {
    test('matches snapshot with tasks and sprint health', () => {
        const props = {
            ...BASE_PROPS,
            myTasks: [
                { id: '1', title: 'Write unit tests', status: 'IN_PROGRESS' },
            ],
            projectSprints: [
                {
                    projectId: 'p1',
                    projectName: 'Oracle PM',
                    sprintName: 'Sprint 1',
                    todo: 1, inProgress: 1, blocked: 0, done: 2,
                },
            ],
        };
        render(<DashboardView {...props} />);
        expect({
            myTasks:     screen.getByTestId('my-tasks-section').textContent,
            kpiCards:    screen.getByTestId('kpi-stat-cards').textContent,
            sprintHealth: screen.getByTestId('sprint-health-section').textContent,
        }).toMatchSnapshot();
    });

    test('matches snapshot when no data is present', () => {
        render(<DashboardView {...BASE_PROPS} />);
        expect({
            myTasks:     screen.getByTestId('my-tasks-section').textContent,
            kpiCards:    screen.getByTestId('kpi-stat-cards').textContent,
            sprintHealth: screen.getByTestId('sprint-health-section').textContent,
        }).toMatchSnapshot();
    });
});

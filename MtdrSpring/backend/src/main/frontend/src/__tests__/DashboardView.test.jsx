import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardView from '../views/dashboard/DashboardView';

// Reusable stat values — every test uses these unless it overrides a specific one.
const BASE_STATS = {
    openTasks: 5,
    projectCount: 1,
    completed: 3,
    blocked: 1,
    avgCycleTime: 2.5,
    cycleTimeChange: 10,
};

// Default props passed to every render. Individual tests override only
// the prop they care about (e.g. myTasks or projectSprints).
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

        // Titles must appear inside the My Tasks section, not just anywhere on the page.
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

        // Raw API values (e.g. IN_PROGRESS) must be converted to readable labels
        // and shown inside My Tasks, not inside the KPI stat cards.
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

        // Each number is checked inside the KPI area so task counts in
        // My Tasks don't accidentally satisfy these assertions.
        const cards = getKpiCards();
        expect(within(cards).getByText('5')).toBeInTheDocument();        // openTasks
        expect(within(cards).getByText('3')).toBeInTheDocument();        // completed
        expect(within(cards).getByText('1')).toBeInTheDocument();        // blocked
        expect(within(cards).getByText('2.5 days')).toBeInTheDocument(); // avgCycleTime formatted with unit
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
        // The callback should only fire when the user clicks, not on mount.
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
        // Snapshot only the text content of each section, not the full HTML,
        // so that purely structural changes (class names, element types) don't
        // break this test — only changes to visible text do.
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

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KanbanView from '../views/kanban/KanbanView';

// recharts calls ResizeObserver internally, which doesn't exist in jsdom.
// Replacing with plain wrappers prevents the crash while still rendering children.
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    BarChart: ({ children }) => <div>{children}</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
}));

const SPRINTS = [
    { id: 's1', name: 'Sprint 1' },
    { id: 's2', name: 'Sprint 2' },
];

const USERS = [
    { id: 'u1', email: 'alice.smith@oracle.com' },
    { id: 'u2', email: 'bob.jones@oracle.com' },
];

const TASKS = [
    { id: 't1', title: 'Build API layer',        status: 'IN_PROGRESS', priority: 'HIGH',   assignee: { id: 'u1' } },
    { id: 't2', title: 'Write unit tests',       status: 'TODO',        priority: 'MEDIUM', assignee: { id: 'u1' } },
    { id: 't3', title: 'Design DB schema',       status: 'DONE',        priority: 'LOW',    assignee: { id: 'u2' } },
    { id: 't4', title: 'Fix broken pipeline',    status: 'BLOCKED',     priority: 'HIGH',   assignee: { id: 'u2' } },
];

// Shared mocks in BASE_PROPS accumulate calls across tests; beforeEach clears
// them so each test starts with a clean call count.
const BASE_PROPS = {
    projectName: 'Oracle PM Tool',
    sprints: SPRINTS,
    sprintId: 's1',
    users: USERS,
    tasks: TASKS,
    isLoading: false,
    onSprintChange: jest.fn(),
    onTaskSelect: jest.fn(),
};

function getAliceRow() { return screen.getByTestId('user-row-u1'); }
function getBobRow()   { return screen.getByTestId('user-row-u2'); }

beforeEach(() => jest.clearAllMocks());

describe('R1 - KanbanView: tasks displayed per assigned user', () => {

    test("shows alice's tasks under her row", () => {
        render(<KanbanView {...BASE_PROPS} />);

        // Each task is scoped to its assignee's row so cross-user leaks are caught.
        const aliceRow = getAliceRow();
        expect(within(aliceRow).getByText('Build API layer')).toBeInTheDocument();
        expect(within(aliceRow).getByText('Write unit tests')).toBeInTheDocument();
    });

    test("shows bob's tasks under his row", () => {
        render(<KanbanView {...BASE_PROPS} />);

        const bobRow = getBobRow();
        expect(within(bobRow).getByText('Design DB schema')).toBeInTheDocument();
        expect(within(bobRow).getByText('Fix broken pipeline')).toBeInTheDocument();
    });

    test("task count badge reflects the number of tasks for that user", () => {
        render(<KanbanView {...BASE_PROPS} />);

        // The badge renders the count in parentheses, e.g. "(2)".
        // alice has 2 tasks, bob has 2 tasks
        expect(within(getAliceRow()).getByText('(2)')).toBeInTheDocument();
        expect(within(getBobRow()).getByText('(2)')).toBeInTheDocument();
    });
});

describe('Mock function - onTaskSelect spy', () => {
    test('calls onTaskSelect with the task id when a task card is clicked', () => {
        const onTaskSelect = jest.fn();
        render(<KanbanView {...BASE_PROPS} onTaskSelect={onTaskSelect} />);

        userEvent.click(within(getAliceRow()).getByText('Build API layer'));

        expect(onTaskSelect).toHaveBeenCalledWith('t1');
        expect(onTaskSelect).toHaveBeenCalledTimes(1);
    });

    test('onTaskSelect is not called when rendering without a click', () => {
        const onTaskSelect = jest.fn();
        render(<KanbanView {...BASE_PROPS} onTaskSelect={onTaskSelect} />);
        expect(onTaskSelect).not.toHaveBeenCalled();
    });
});

describe('Snapshot', () => {
    test('matches snapshot with tasks for two users', () => {
        render(<KanbanView {...BASE_PROPS} />);
        // Snapshot only text content so HTML restructuring doesn't break it.
        expect({
            alice: getAliceRow().textContent,
            bob: getBobRow().textContent,
        }).toMatchSnapshot();
    });
});

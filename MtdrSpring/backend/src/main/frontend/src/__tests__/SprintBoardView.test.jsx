import React from 'react';
import { render, screen, within, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SprintBoardView from '../views/sprints/SprintBoardView';

// @dnd-kit relies on pointer events and layout APIs that don't exist in jsdom.
// The mock replaces DndContext with a plain wrapper and captures the onDragEnd
// callback in a global so tests can fire drags programmatically.
jest.mock('@dnd-kit/core', () => ({
    DndContext: function DndContext({ children, onDragEnd }) {
        global.__dndOnDragEnd = onDragEnd;
        return children;
    },
    DragOverlay: function DragOverlay() { return null; },
    PointerSensor: function PointerSensor() {},
    useSensor: function useSensor() { return {}; },
    useSensors: function useSensors() { return []; },
    useDroppable: function useDroppable() { return { setNodeRef: function() {} }; },
    useDraggable: function useDraggable() {
        return { attributes: {}, listeners: {}, setNodeRef: function() {}, isDragging: false };
    },
    closestCenter: function closestCenter() {},
}));

const SPRINT = {
    id: 's1',
    name: 'Sprint 4',
    startDate: '2024-03-01',
    endDate: '2024-03-14',
    plannedTaskCount: 6,
};

const MEMBERS = [
    { user: { id: 'u1', email: 'dev1@oracle.com' } },
    { user: { id: 'u2', email: 'dev2@oracle.com' } },
];

const TASKS = [
    { id: 't1', title: 'Setup DB schema',         status: 'TODO',        priority: 'HIGH',   assignee: { id: 'u1', email: 'dev1@oracle.com' } },
    { id: 't2', title: 'Create REST routes',      status: 'IN_PROGRESS', priority: 'MEDIUM', assignee: { id: 'u1', email: 'dev1@oracle.com' } },
    { id: 't3', title: 'Write unit tests',        status: 'DONE',        priority: 'LOW',    assignee: { id: 'u2', email: 'dev2@oracle.com' } },
    { id: 't4', title: 'Fix broken pipeline',     status: 'BLOCKED',     priority: 'HIGH',   assignee: { id: 'u2', email: 'dev2@oracle.com' } },
    { id: 't5', title: 'Deploy to staging',       status: 'DONE',        priority: 'MEDIUM', assignee: { id: 'u1', email: 'dev1@oracle.com' } },
];

// onCreateTask / onLogWork must return a resolved promise so the component
// doesn't get stuck waiting for an async result after the test ends.
const HANDLERS = {
    onBack: jest.fn(),
    onTaskSelect: jest.fn(),
    onStatusChange: jest.fn(),
    onCreateTask: jest.fn().mockResolvedValue({}),
    onLogWork: jest.fn().mockResolvedValue({}),
};

function getDoneColumn()        { return screen.getByTestId('column-DONE'); }
function getTodoColumn()        { return screen.getByTestId('column-TODO'); }
function getInProgressColumn()  { return screen.getByTestId('column-IN_PROGRESS'); }
function getBlockedColumn()     { return screen.getByTestId('column-BLOCKED'); }
function getLogHoursDialog()    { return screen.getByTestId('log-hours-dialog'); }

beforeEach(() => {
    jest.clearAllMocks();
    // Reset the captured drag callback so a leftover from a previous test
    // can't accidentally be triggered.
    global.__dndOnDragEnd = null;
});

describe('R3 - Sprint board: completed tasks per sprint', () => {
    test('each task appears inside its matching status column', () => {
        render(
            <SprintBoardView
                sprint={SPRINT} tasks={TASKS} members={MEMBERS}
                projectId="p1" {...HANDLERS}
            />
        );
        expect(within(getTodoColumn()).getByText('Setup DB schema')).toBeInTheDocument();
        expect(within(getInProgressColumn()).getByText('Create REST routes')).toBeInTheDocument();
        expect(within(getBlockedColumn()).getByText('Fix broken pipeline')).toBeInTheDocument();
        expect(within(getDoneColumn()).getByText('Write unit tests')).toBeInTheDocument();
        expect(within(getDoneColumn()).getByText('Deploy to staging')).toBeInTheDocument();
    });
});

describe('R4 - Marking a task as completed', () => {
    test('dragging a task to DONE opens the Log Hours dialog', async () => {
        render(<SprintBoardView sprint={SPRINT} tasks={TASKS} members={MEMBERS} projectId="p1" {...HANDLERS} />);

        // Fire the captured onDragEnd callback to simulate dropping t1 onto DONE.
        await act(async () => {
            global.__dndOnDragEnd({ active: { id: 't1' }, over: { id: 'DONE' } });
        });

        // The dialog appears asynchronously after React processes the drop.
        await waitFor(() => expect(getLogHoursDialog()).toBeInTheDocument());
    });

    test('confirming hours calls onLogWork and marks the task as done', async () => {
        render(<SprintBoardView sprint={SPRINT} tasks={TASKS} members={MEMBERS} projectId="p1" {...HANDLERS} />);

        await act(async () => {
            global.__dndOnDragEnd({ active: { id: 't1' }, over: { id: 'DONE' } });
        });
        await waitFor(() => getLogHoursDialog());

        await act(async () => { userEvent.type(within(getLogHoursDialog()).getByLabelText(/hours worked/i), '4'); });
        await act(async () => { userEvent.click(within(getLogHoursDialog()).getByRole('button', { name: /confirm/i })); });

        await waitFor(() => {
            expect(HANDLERS.onLogWork).toHaveBeenCalledWith('t1', expect.objectContaining({ hoursWorked: 4 }));
            expect(HANDLERS.onStatusChange).toHaveBeenCalledWith('t1', 'DONE', 'u1');
        });
    });

    test('cancelling the Log Hours dialog does not change the task status', async () => {
        render(<SprintBoardView sprint={SPRINT} tasks={TASKS} members={MEMBERS} projectId="p1" {...HANDLERS} />);

        await act(async () => {
            global.__dndOnDragEnd({ active: { id: 't1' }, over: { id: 'DONE' } });
        });
        await waitFor(() => getLogHoursDialog());

        await act(async () => { userEvent.click(within(getLogHoursDialog()).getByRole('button', { name: /cancel/i })); });

        // queryByTestId returns null instead of throwing, suitable when we
        // expect the element to be gone.
        await waitFor(() => expect(screen.queryByTestId('log-hours-dialog')).not.toBeInTheDocument());
        expect(HANDLERS.onStatusChange).not.toHaveBeenCalled();
        expect(HANDLERS.onLogWork).not.toHaveBeenCalled();
    });
});

describe('Mock function - onTaskSelect spy', () => {
    test('calls onTaskSelect with the task id when a card is clicked', async () => {
        render(
            <SprintBoardView
                sprint={SPRINT} tasks={TASKS} members={MEMBERS}
                projectId="p1" {...HANDLERS}
            />
        );
        await act(async () => {
            userEvent.click(within(getTodoColumn()).getByText('Setup DB schema'));
        });
        expect(HANDLERS.onTaskSelect).toHaveBeenCalledWith('t1');
        expect(HANDLERS.onTaskSelect).toHaveBeenCalledTimes(1);
    });
});

describe('Snapshot', () => {
    test('matches snapshot for an empty sprint board', () => {
        render(<SprintBoardView sprint={SPRINT} tasks={[]} members={MEMBERS} projectId="p1" {...HANDLERS} />);
        // Snapshot only text content so HTML restructuring doesn't break it.
        expect({
            todo:       screen.getByTestId('column-TODO').textContent,
            inProgress: screen.getByTestId('column-IN_PROGRESS').textContent,
            blocked:    screen.getByTestId('column-BLOCKED').textContent,
            done:       screen.getByTestId('column-DONE').textContent,
        }).toMatchSnapshot();
    });
});

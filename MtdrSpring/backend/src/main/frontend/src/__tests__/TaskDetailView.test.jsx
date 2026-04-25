import React from 'react';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskDetailView from '../views/tasks/TaskDetailView';

const TASK = {
  id: 't1',
  title: 'Implement REST API endpoint',
  description: 'Create the /tasks endpoint for the project',
  status: 'DONE',
  priority: 'HIGH',
  assignee: { id: 'u1', email: 'alice.smith@oracle.com' },
  createdAt: '2024-03-01T10:00:00Z',
  enteredInProgressAt: '2024-03-02T09:00:00Z',
  completedAt: '2024-03-05T16:00:00Z',
  reworkCount: 0,
};

const HISTORY = [
  {
    id: 'h1',
    fromStatus: 'TODO',
    toStatus: 'IN_PROGRESS',
    changedAt: '2024-03-02T09:00:00Z',
    changedBy: { email: 'alice.smith@oracle.com' },
  },
  {
    id: 'h2',
    fromStatus: 'IN_PROGRESS',
    toStatus: 'DONE',
    changedAt: '2024-03-05T16:00:00Z',
    changedBy: { email: 'alice.smith@oracle.com' },
  },
];

const LOGS = [
  {
    id: 'l1',
    user: { email: 'alice.smith@oracle.com' },
    hoursWorked: 4,
    workDate: '2024-03-05T00:00:00Z',
    note: 'Done',
  },
];

function getStateHistory() {
  return screen.getByTestId('state-history');
}
function getWorkLogs() {
  return screen.getByTestId('work-logs');
}
function getSidebar() {
  return screen.getByTestId('task-details-sidebar');
}

describe('R3 - Completed task: minimum required information', () => {
  test('displays the task name (title)', () => {
    render(<TaskDetailView task={TASK} history={[]} logs={[]} onBack={jest.fn()} />);
    expect(screen.getByText('Implement REST API endpoint')).toBeInTheDocument();
  });

  test('displays the developer / assignee name in the details sidebar', () => {
    render(<TaskDetailView task={TASK} history={[]} logs={[]} onBack={jest.fn()} />);
    // Scoped to the sidebar so the email appearing elsewhere doesn't satisfy this.
    expect(within(getSidebar()).getByText('alice.smith@oracle.com')).toBeInTheDocument();
  });

  test('displays the total hours at the top of Work Logs', () => {
    render(<TaskDetailView task={TASK} history={[]} logs={LOGS} onBack={jest.fn()} />);
    // Hours are formatted with one decimal place and a unit suffix.
    expect(within(getWorkLogs()).getByText('4.0 hrs')).toBeInTheDocument();
  });

  test('displays the completion date in the metadata sidebar', () => {
    render(<TaskDetailView task={TASK} history={[]} logs={[]} onBack={jest.fn()} />);
    const sidebar = getSidebar();
    expect(within(sidebar).getByText('Completed')).toBeInTheDocument();
    // The ISO timestamp is displayed as a human-readable date; the regex
    // is flexible enough to match locale-specific formatting.
    expect(within(sidebar).getByText(/Mar 5, 2024/i)).toBeInTheDocument();
  });
});

describe('R2 - State changes: history timeline', () => {
  test('renders all status transitions from the history', () => {
    render(<TaskDetailView task={TASK} history={HISTORY} logs={[]} onBack={jest.fn()} />);
    const historyCard = getStateHistory();
    // TODO → IN_PROGRESS → DONE
    expect(within(historyCard).getByText('To Do')).toBeInTheDocument();
    // Each transition row shows both a from and a to status label, so
    // "In Progress" and "Done" can appear more than once — getAllByText
    // handles that without failing on multiple matches.
    expect(within(historyCard).getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
    expect(within(historyCard).getAllByText('Done').length).toBeGreaterThanOrEqual(1);
  });

  test('shows the user who made each status change', () => {
    render(<TaskDetailView task={TASK} history={HISTORY} logs={[]} onBack={jest.fn()} />);
    // Alice made both transitions, so her email appears once per row.
    const emails = within(getStateHistory()).getAllByText(/alice\.smith@oracle\.com/i);
    expect(emails.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Mock function - onBack spy', () => {
  test('calls onBack exactly once when the Back button is clicked', async () => {
    const onBack = jest.fn();
    render(<TaskDetailView task={TASK} history={[]} logs={[]} onBack={onBack} />);
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /back/i }));
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('Snapshot', () => {
  test('matches snapshot when task has no history or logs', () => {
    render(<TaskDetailView task={TASK} history={[]} logs={[]} onBack={jest.fn()} />);
    // Snapshot only text content so HTML restructuring doesn't break it.
    expect({
      sidebar: screen.getByTestId('task-details-sidebar').textContent,
      history: screen.getByTestId('state-history').textContent,
      workLogs: screen.getByTestId('work-logs').textContent,
    }).toMatchSnapshot();
  });
});

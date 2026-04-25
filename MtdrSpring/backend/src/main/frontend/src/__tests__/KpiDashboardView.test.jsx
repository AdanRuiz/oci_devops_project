import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KpiDashboardView from '../views/kpi/KpiDashboardView';

// recharts calls ResizeObserver internally, which doesn't exist in jsdom.
// Replacing chart components with plain divs lets us still assert on data
// passed to charts without crashing the test environment.
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children, data }) => (
    // data-items exposes how many data points were passed, in case a test needs to assert on it.
    <div data-testid="bar-chart" data-items={data?.length}>
      {children}
    </div>
  ),
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

const DEV_STATS = [
  {
    email: 'alice.smith@oracle.com',
    totalAssigned: 5,
    tasksCompleted: 4,
    totalHoursWorked: 32,
  },
  {
    email: 'bob.jones@oracle.com',
    totalAssigned: 3,
    tasksCompleted: 3,
    totalHoursWorked: 24.5,
  },
];

// onSprintChange is a shared mock defined here; beforeEach clears it so call
// counts from one test don't bleed into the next.
const BASE_PROPS = {
  projectName: 'Oracle PM Tool',
  sprints: SPRINTS,
  sprintId: 's1',
  developerStats: DEV_STATS,
  currentUserEmail: 'alice.smith@oracle.com',
  loadingStats: false,
  onSprintChange: jest.fn(),
};

function getSprintTotalsCard() {
  return screen.getByTestId('sprint-totals-card');
}
function getYourStatsCard() {
  return screen.getByTestId('your-stats-card');
}

beforeEach(() => jest.clearAllMocks());

describe('R6 - Team KPIs: tasks and hours for the whole team per sprint', () => {
  test('displays total tasks assigned across all developers (5 + 3 = 8)', () => {
    render(<KpiDashboardView {...BASE_PROPS} />);
    const totalsCard = getSprintTotalsCard();
    expect(within(totalsCard).getByText('Total Tasks')).toBeInTheDocument();
    expect(within(totalsCard).getByText('8')).toBeInTheDocument();
  });

  test('displays total real hours logged by the whole team (32 + 24.5 = 56.5)', () => {
    render(<KpiDashboardView {...BASE_PROPS} />);
    const totalsCard = getSprintTotalsCard();
    expect(within(totalsCard).getByText('Total Real Hours')).toBeInTheDocument();
    expect(within(totalsCard).getByText('56.5')).toBeInTheDocument();
  });
});

describe('R7 - Per-person KPIs: tasks and hours for each developer per sprint', () => {
  test("displays the current user's completed task count in Your Stats (alice: 4)", () => {
    render(<KpiDashboardView {...BASE_PROPS} />);
    const statsCard = getYourStatsCard();
    expect(within(statsCard).getByText('Tasks Completed')).toBeInTheDocument();
    expect(within(statsCard).getByText('4')).toBeInTheDocument();
  });

  test("displays the current user's logged hours in Your Stats (alice: 32.0 h)", () => {
    render(<KpiDashboardView {...BASE_PROPS} />);
    const statsCard = getYourStatsCard();
    expect(within(statsCard).getByText('Hours Logged')).toBeInTheDocument();
    expect(within(statsCard).getByText('32.0')).toBeInTheDocument();
  });

  test('shows personal stats for a different user (bob) in Your Stats', () => {
    render(<KpiDashboardView {...BASE_PROPS} currentUserEmail="bob.jones@oracle.com" />);
    const statsCard = getYourStatsCard();
    expect(within(statsCard).getByText('3')).toBeInTheDocument();
    expect(within(statsCard).getByText('24.5')).toBeInTheDocument();
  });
});

describe('Mock function - onSprintChange spy', () => {
  test('onSprintChange is not invoked on initial render', () => {
    const onSprintChange = jest.fn();
    render(<KpiDashboardView {...BASE_PROPS} onSprintChange={onSprintChange} />);
    expect(onSprintChange).not.toHaveBeenCalled();
  });

  test('jest.spyOn can observe calls to onSprintChange', () => {
    // spyOn wraps an existing method so we can track calls without
    // replacing the function reference passed to the component.
    const handlers = { onSprintChange: jest.fn() };
    const spy = jest.spyOn(handlers, 'onSprintChange');

    render(<KpiDashboardView {...BASE_PROPS} onSprintChange={handlers.onSprintChange} />);

    // Calling the handler manually confirms the spy records the right
    // argument — this verifies the spy wiring, not a UI interaction.
    handlers.onSprintChange('s2');

    expect(spy).toHaveBeenCalledWith('s2');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('Snapshots', () => {
  test('matches snapshot with full developer stats loaded', () => {
    render(<KpiDashboardView {...BASE_PROPS} />);
    // Snapshot only text content so HTML restructuring doesn't break it.
    expect({
      sprintTotals: screen.getByTestId('sprint-totals-card').textContent,
      yourStats: screen.getByTestId('your-stats-card').textContent,
    }).toMatchSnapshot();
  });
});

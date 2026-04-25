import React from 'react';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileView from '../views/profile/ProfileView';

const MEMBERS = [
  { user: { id: 'u1', email: 'alice.smith@oracle.com' } },
  { user: { id: 'u2', email: 'bob.jones@oracle.com' } },
];

const MANAGER_PROPS = {
  userEmail: 'alice.smith@oracle.com',
  userRole: 'PROJECT_MANAGER',
  projectName: 'Oracle PM Tool',
  totalMembers: 2,
  members: MEMBERS,
  isLoading: false,
  isManager: true,
  onRemoveMember: jest.fn(),
  onInviteMember: jest.fn(),
  isRemoving: false,
  isInviting: false,
  inviteError: null,
  inviteSuccess: false,
};

// Derived from MANAGER_PROPS — only the role-related fields differ, so we
// don't repeat the full prop list twice.
const DEVELOPER_PROPS = {
  ...MANAGER_PROPS,
  userEmail: 'bob.jones@oracle.com',
  userRole: 'DEVELOPER',
  isManager: false,
};

function getInviteSection() {
  return screen.getByTestId('invite-section');
}
function getMembersList() {
  return screen.getByTestId('members-list');
}

beforeEach(() => jest.clearAllMocks());

describe('R5 - Role-based dashboard: PROJECT_MANAGER', () => {
  test('shows the Invite member section', () => {
    render(<ProfileView {...MANAGER_PROPS} />);
    expect(within(getInviteSection()).getByText('Invite member')).toBeInTheDocument();
  });

  test('shows the Send invite button inside the invite section', () => {
    render(<ProfileView {...MANAGER_PROPS} />);
    expect(
      within(getInviteSection()).getByRole('button', { name: /send invite/i })
    ).toBeInTheDocument();
  });

  test('shows a Remove button for each team member inside the members list', () => {
    render(<ProfileView {...MANAGER_PROPS} />);
    // One Remove button per member — the count must match exactly.
    const removeButtons = within(getMembersList()).getAllByRole('button', { name: /remove/i });
    expect(removeButtons).toHaveLength(MEMBERS.length);
  });

  test('displays the PROJECT_MANAGER role label', () => {
    render(<ProfileView {...MANAGER_PROPS} />);
    // The label can appear in multiple places (header, badge), so
    // getAllByText is used and we only assert at least one is visible.
    const roleLabels = screen.getAllByText('PROJECT_MANAGER');
    expect(roleLabels.length).toBeGreaterThanOrEqual(1);
  });
});

describe('R5 - Role-based dashboard: DEVELOPER', () => {
  test('does not show the Invite member section', () => {
    render(<ProfileView {...DEVELOPER_PROPS} />);
    // queryByTestId returns null instead of throwing when the element is
    // absent, which is what we need to assert "not present".
    expect(screen.queryByTestId('invite-section')).not.toBeInTheDocument();
  });

  test('does not show a Send invite button', () => {
    render(<ProfileView {...DEVELOPER_PROPS} />);
    expect(screen.queryByRole('button', { name: /send invite/i })).not.toBeInTheDocument();
  });

  test('does not show Remove buttons inside the members list', () => {
    render(<ProfileView {...DEVELOPER_PROPS} />);
    expect(
      within(getMembersList()).queryByRole('button', { name: /remove/i })
    ).not.toBeInTheDocument();
  });

  test('displays the DEVELOPER role label', () => {
    render(<ProfileView {...DEVELOPER_PROPS} />);
    const roleLabels = screen.getAllByText('DEVELOPER');
    expect(roleLabels.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Mock function - onInviteMember spy', () => {
  test('calls onInviteMember with the typed email when Send is clicked', async () => {
    const onInviteMember = jest.fn();
    render(<ProfileView {...MANAGER_PROPS} onInviteMember={onInviteMember} />);

    const inviteSection = getInviteSection();
    const input = within(inviteSection).getByPlaceholderText('colleague@oracle.com');
    // Wrap userEvent in act so React flushes all state updates from each
    // keystroke before the click assertion runs.
    await act(async () => {
      userEvent.type(input, 'new.dev@oracle.com');
    });
    await act(async () => {
      userEvent.click(within(inviteSection).getByRole('button', { name: /send invite/i }));
    });

    expect(onInviteMember).toHaveBeenCalledWith('new.dev@oracle.com');
    expect(onInviteMember).toHaveBeenCalledTimes(1);
  });

  test('Send invite button is disabled when the email field is empty', () => {
    render(<ProfileView {...MANAGER_PROPS} />);
    // Prevents submitting the form without an address typed in.
    const button = within(getInviteSection()).getByRole('button', { name: /send invite/i });
    expect(button).toBeDisabled();
  });
});

describe('Snapshots', () => {
  test('matches snapshot for the PROJECT_MANAGER view', () => {
    render(<ProfileView {...MANAGER_PROPS} />);
    // Snapshot only text content so HTML restructuring doesn't break it.
    expect({
      inviteSection: screen.getByTestId('invite-section').textContent,
      membersList: screen.getByTestId('members-list').textContent,
    }).toMatchSnapshot();
  });

  test('matches snapshot for the DEVELOPER view', () => {
    render(<ProfileView {...DEVELOPER_PROPS} />);
    expect({
      membersList: screen.getByTestId('members-list').textContent,
    }).toMatchSnapshot();
  });
});

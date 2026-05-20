import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Trash2, UserPlus, Users } from 'lucide-react';
import { fetchDashboardBundle } from './dashboardApi';
import { MOCK_TEAMS } from './dashboardMocks';
import DashboardKpiStrip from './DashboardKpiStrip';
import { DashboardListViewSkeleton } from './DashboardSkeletons';

function initialsFromName(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return 'NA';
}

function DashboardTeam() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [source, setSource] = useState('api');
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [teamForm, setTeamForm] = useState({
    name: '',
    managerId: '',
    memberIds: [],
  });
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
  });
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const managerMenuRef = useRef(null);

  const loadData = useCallback(async () => {
    const bundle = await fetchDashboardBundle();
    if (bundle.teamsOk) {
      return {
        teamsData: bundle.teams,
        usersData: bundle.usersOk ? bundle.users : [],
        mode: 'api',
      };
    }
    return {
      teamsData: MOCK_TEAMS,
      usersData: bundle.usersOk ? bundle.users : [],
      mode: 'mock',
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadData();
      if (cancelled) return;
      setTeams(data.teamsData);
      setUsers(data.usersData);
      setSource(data.mode);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!managerMenuRef.current?.contains(event.target)) {
        setIsManagerOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const toggleMember = (userId) => {
    setTeamForm((prev) => {
      const selected = new Set(prev.memberIds.map(String));
      const value = String(userId);
      if (selected.has(value)) selected.delete(value);
      else selected.add(value);
      return { ...prev, memberIds: [...selected] };
    });
  };

  const inviteDeveloper = async () => {
    setError('');
    const name = inviteForm.name.trim();
    const email = inviteForm.email.trim();
    if (!name || !email) {
      setError('Invite requires name and email.');
      return;
    }
    const payload = {
      name,
      email,
      telegramId: email.split('@')[0],
      role: 'DEVELOPER',
      workMode: 'REMOTE',
      isActive: 1,
      passwordHash: 'temporary',
    };
    const response = await fetch('/adduser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setError('Could not invite developer.');
      return;
    }
    const usersRes = await fetch('/users');
    if (usersRes.ok) {
      const updatedUsers = await usersRes.json();
      setUsers(updatedUsers);
      const created =
        [...updatedUsers]
          .reverse()
          .find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null;
      if (created?.id) {
        setTeamForm((prev) => ({
          ...prev,
          memberIds: [...new Set([...prev.memberIds.map(String), String(created.id)])],
        }));
      }
    }
    setInviteForm({ name: '', email: '' });
  };

  const createTeam = async (event) => {
    event.preventDefault();
    setError('');
    const name = teamForm.name.trim();
    const managerId = Number(teamForm.managerId);
    if (!name) return setError('Team name is required.');
    if (!managerId) return setError('Manager is required.');

    setIsCreating(true);
    try {
      const teamRes = await fetch('/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, managerId }),
      });
      if (!teamRes.ok) throw new Error('Could not create team.');
      const created = await teamRes.json();

      const memberIds = new Set(teamForm.memberIds.map((id) => Number(id)));
      memberIds.add(managerId);
      await Promise.all(
        [...memberIds]
          .filter(Boolean)
          .map((memberUserId) =>
            fetch('/team-members', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ teamId: created.id, memberUserId }),
            })
          )
      );

      const refreshed = await loadData();
      setTeams(refreshed.teamsData);
      setUsers(refreshed.usersData);
      setShowModal(false);
      setIsManagerOpen(false);
      setTeamForm({ name: '', managerId: '', memberIds: [] });
      setInviteForm({ name: '', email: '' });
    } catch (e) {
      setError(e.message || 'Failed to create team.');
    } finally {
      setIsCreating(false);
    }
  };

  const totals = useMemo(
    () => ({
      teams: teams.length,
      members: teams.reduce((sum, team) => sum + (team.users?.length || 0), 0),
    }),
    [teams]
  );

  const kpiItems = useMemo(
    () => [
      { icon: Users, label: 'Teams', value: totals.teams, metaLabel: null },
      { icon: Users, label: 'Members', value: totals.members, metaLabel: null },
      {
        icon: Users,
        label: 'Avg size',
        value: totals.teams > 0 ? (totals.members / totals.teams).toFixed(1) : '0',
        metaLabel: null,
      },
    ],
    [totals]
  );

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      const response = await fetch(
        `/team-members/${memberToDelete.teamId}/${memberToDelete.userId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Could not remove member.');
      const refreshed = await loadData();
      setTeams(refreshed.teamsData);
      setUsers(refreshed.usersData);
      setMemberToDelete(null);
    } catch (e) {
      setError(e.message || 'Failed to remove member.');
      setMemberToDelete(null);
    }
  };

  if (loading) return <DashboardListViewSkeleton title="Loading teams" showFilters={false} />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#2A1814]">Team</h2>
          <p className="mt-1 text-sm text-[#6B6560]">
            Manage teams and developers
            {source === 'mock' && <span className="ml-2 text-xs text-[#c74634]">(preview data)</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2A1814] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d110e]"
        >
          <UserPlus className="h-4 w-4" />
          New team
        </button>
      </div>

      <DashboardKpiStrip items={kpiItems} />

      <div className="space-y-8">
        {teams.length === 0 ? (
          <p className="text-sm text-[#6B6560]">No teams yet.</p>
        ) : (
          teams.map((team) => (
            <section key={team.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A1814]/[0.08] pb-3">
                <div>
                  <h3 className="text-base font-semibold text-[#2A1814]">{team.name}</h3>
                  <p className="mt-1 text-xs text-[#6B6560]">{team.users?.length || 0} members</p>
                </div>
              </div>
              <div className="mt-2">
                {(team.users || []).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 border-b border-[#2A1814]/[0.06] py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c74634]/15 text-[10px] font-semibold text-[#c74634]">
                        {initialsFromName(user.name || user.email)}
                      </span>
                      <span className="text-sm text-[#2A1814]">{user.name || user.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setMemberToDelete({
                          teamId: team.id,
                          userId: user.id,
                          teamName: team.name,
                          userName: user.name || user.email,
                        })
                      }
                      className="inline-flex items-center text-[#6B6560] transition hover:text-[#c74634]"
                      aria-label={`Remove ${user.name || user.email} from ${team.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#2A1814]/10 bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#2A1814]">Create new team</h3>
              <p className="mt-1 text-sm text-[#6B6560]">
                Assign existing developers or invite a new developer.
              </p>
            </div>
            <form onSubmit={createTeam} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-[#2a1814]/60">Team name</span>
                  <span className="flex items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 focus-within:border-[#2a1814]">
                    <input
                      value={teamForm.name}
                      onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full border-0 bg-transparent text-sm text-[#2a1814] placeholder:text-[#2a1814]/35 focus:outline-none focus:ring-0"
                      placeholder="Platform Team"
                    />
                  </span>
                </label>
                <label className="block" ref={managerMenuRef}>
                  <span className="mb-2 block text-sm text-[#2a1814]/60">Manager</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsManagerOpen((prev) => !prev)}
                      className="flex w-full items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 text-left focus:border-[#2a1814] focus:outline-none"
                      aria-haspopup="listbox"
                      aria-expanded={isManagerOpen}
                    >
                      <span className="w-full text-sm text-[#2a1814]">
                        {teamForm.managerId
                          ? users.find((u) => String(u.id) === String(teamForm.managerId))?.name ||
                            users.find((u) => String(u.id) === String(teamForm.managerId))?.email ||
                            `User ${teamForm.managerId}`
                          : 'Select manager'}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#2a1814]/55" />
                    </button>
                    {isManagerOpen && (
                      <div className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#2A1814]/10 bg-white shadow-lg">
                        <ul role="listbox" className="py-1">
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                setTeamForm((prev) => ({ ...prev, managerId: '' }));
                                setIsManagerOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-[#2A1814] hover:bg-[#faf9f6]"
                            >
                              Select manager
                            </button>
                          </li>
                          {users.map((user) => {
                            const value = String(user.id);
                            const active = String(teamForm.managerId) === value;
                            return (
                              <li key={user.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTeamForm((prev) => ({ ...prev, managerId: value }));
                                    setIsManagerOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-sm transition ${
                                    active ? 'bg-[#2A1814] text-white' : 'text-[#2A1814] hover:bg-[#faf9f6]'
                                  }`}
                                >
                                  {user.name || user.email}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[#2A1814]">Assign existing developers</p>
                <div className="overflow-hidden rounded-xl border border-[#2A1814]/10">
                  {users.map((user) => {
                    const checked = teamForm.memberIds.map(String).includes(String(user.id));
                    return (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-center justify-between gap-3 border-b border-[#2A1814]/[0.06] px-3 py-2.5 text-sm text-[#2A1814] last:border-b-0 hover:bg-[#faf9f6]"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c74634]/15 text-[10px] font-semibold text-[#c74634]">
                            {initialsFromName(user.name || user.email)}
                          </span>
                          <span>{user.name || user.email}</span>
                        </span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                            checked
                              ? 'border-[#2A1814] bg-[#2A1814] text-white'
                              : 'border-[#2A1814]/25 bg-white text-transparent'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <input
                          checked={checked}
                          onChange={() => toggleMember(user.id)}
                          type="checkbox"
                          className="sr-only"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[#2A1814]">Invite new developer</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#2a1814]/60">Name</span>
                    <span className="flex items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 focus-within:border-[#2a1814]">
                      <input
                        value={inviteForm.name}
                        onChange={(e) => setInviteForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Name"
                        className="w-full border-0 bg-transparent text-sm text-[#2a1814] placeholder:text-[#2a1814]/35 focus:outline-none focus:ring-0"
                      />
                    </span>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#2a1814]/60">Email</span>
                    <span className="flex items-center gap-2 border-0 border-b border-[#2a1814]/20 py-2.5 focus-within:border-[#2a1814]">
                      <input
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="Email"
                        className="w-full border-0 bg-transparent text-sm text-[#2a1814] placeholder:text-[#2a1814]/35 focus:outline-none focus:ring-0"
                      />
                    </span>
                  </label>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={inviteDeveloper}
                    className="rounded-full bg-[#2A1814] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1d110e]"
                  >
                    Invite & add
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-[#c74634]">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-[#2A1814]/15 px-4 py-2 text-sm font-medium text-[#2A1814]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-full bg-[#2A1814] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1d110e] disabled:opacity-70"
                >
                  {isCreating ? 'Creating…' : 'Create team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {memberToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#2A1814]/10 bg-white p-6 shadow-xl">
            <h4 className="text-base font-semibold text-[#2A1814]">Are you sure?</h4>
            <p className="mt-2 text-sm text-[#6B6560]">
              This will remove <span className="font-medium text-[#2A1814]">{memberToDelete.userName}</span> from{' '}
              <span className="font-medium text-[#2A1814]">{memberToDelete.teamName}</span>.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="rounded-full border border-[#2A1814]/15 px-4 py-2 text-sm font-medium text-[#2A1814]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                className="rounded-full bg-[#2A1814] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1d110e]"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardTeam;

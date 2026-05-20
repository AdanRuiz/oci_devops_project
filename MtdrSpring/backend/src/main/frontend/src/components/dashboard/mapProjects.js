function pickActiveSprint(sprints) {
  if (!sprints?.length) return null;
  const now = Date.now();
  const current = sprints.find((s) => {
    const start = new Date(s.startDate).getTime();
    const end = new Date(s.endDate).getTime();
    return !Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end;
  });
  return current || sprints[sprints.length - 1];
}

/** Sprints that appear on this team's tasks, ordered by start date. */
export function sprintsForTeam(teamTasks, allSprints = []) {
  const ids = [...new Set(teamTasks.map((t) => t.sprint?.id).filter(Boolean))];
  if (ids.length === 0) return [];
  const byId = new Map(allSprints.map((s) => [s.id, s]));
  const merged = ids
    .map((id) => {
      const full = byId.get(id);
      if (full) return full;
      const t = teamTasks.find((x) => x.sprint?.id === id);
      return t?.sprint || null;
    })
    .filter(Boolean);
  return merged.sort((a, b) => {
    const ta = new Date(a.startDate || 0).getTime();
    const tb = new Date(b.startDate || 0).getTime();
    if (ta !== tb) return ta - tb;
    return (a.id || 0) - (b.id || 0);
  });
}

function memberInitials(user) {
  const name = user?.name || user?.email || '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * Maps API teams (+ tasks/sprints) to project cards for the UI.
 */
export function mapTeamsToProjects(teams, tasks = [], sprints = []) {
  const activeSprint = pickActiveSprint(sprints);

  return teams.map((team) => {
    const members = team.users || [];
    const memberIds = new Set(members.map((u) => u.id));
    const teamTasks = tasks.filter((t) => memberIds.has(t.assignedTo));
    const openTasks = teamTasks.filter((t) => t.status !== 'DONE');
    const doneTasks = teamTasks.filter((t) => t.status === 'DONE');

    const sprintFromTasks = teamTasks
      .map((t) => t.sprint?.name)
      .find(Boolean);

    const projectSprints = sprintsForTeam(teamTasks, sprints);

    const inProgress = teamTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const isCompleted = openTasks.length === 0 && doneTasks.length > 0;
    const isActive = openTasks.length > 0 || inProgress > 0;

    return {
      id: team.id,
      name: team.name,
      memberCount: members.length,
      members: members.slice(0, 4).map((u) => ({
        id: u.id,
        name: u.name || u.email,
        initials: memberInitials(u),
      })),
      taskCount: teamTasks.length,
      openTasks: openTasks.length,
      doneTasks: doneTasks.length,
      inProgress,
      activeSprintName: sprintFromTasks || activeSprint?.name || null,
      status: isCompleted ? 'Completed' : isActive ? 'Active' : 'Planning',
      sprints: projectSprints,
    };
  });
}

export function summarizeProjects(projects) {
  const totalTasks = projects.reduce((sum, p) => sum + p.taskCount, 0);
  const totalDone = projects.reduce((sum, p) => sum + p.doneTasks, 0);
  const openTasks = projects.reduce((sum, p) => sum + p.openTasks, 0);

  return {
    totalProjects: projects.length,
    totalMembers: projects.reduce((sum, p) => sum + p.memberCount, 0),
    openTasks,
    totalDone,
    activeProjects: projects.filter((p) => p.status === 'Active' || p.status === 'Planning').length,
    completedProjects: projects.filter((p) => p.status === 'Completed').length,
    completionRate: totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0,
  };
}

export function partitionProjects(projects) {
  const active = projects.filter((p) => p.status !== 'Completed');
  const completed = projects.filter((p) => p.status === 'Completed');
  return { active, completed };
}

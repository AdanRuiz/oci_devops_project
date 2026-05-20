/**
 * Fetch helpers for dashboard pages.
 * Mocks are used only when the API is unreachable (e.g. Vite without backend).
 * When Docker returns data (even empty arrays), live responses are used.
 */

export async function fetchJsonSafe(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { ok: false, data: null, status: res.status };
    }
    const data = await res.json();
    return { ok: true, data, status: res.status };
  } catch (error) {
    console.error(`Failed to fetch ${url}`, error);
    return { ok: false, data: null, status: 0 };
  }
}

/** @returns {{ items: unknown[], source: 'api' | 'empty' | 'mock' }} */
export function resolveList({ ok, data }, mockItems) {
  if (ok && Array.isArray(data) && data.length > 0) {
    return { items: data, source: 'api' };
  }
  if (ok) {
    return { items: [], source: 'empty' };
  }
  return { items: mockItems, source: 'mock' };
}

export async function fetchDashboardBundle() {
  const [teamsRes, tasksRes, sprintsRes, usersRes] = await Promise.all([
    fetchJsonSafe('/teams'),
    fetchJsonSafe('/tasks'),
    fetchJsonSafe('/sprints'),
    fetchJsonSafe('/users'),
  ]);

  return {
    teams: teamsRes.ok && Array.isArray(teamsRes.data) ? teamsRes.data : [],
    tasks: tasksRes.ok && Array.isArray(tasksRes.data) ? tasksRes.data : [],
    sprints: sprintsRes.ok && Array.isArray(sprintsRes.data) ? sprintsRes.data : [],
    users: usersRes.ok && Array.isArray(usersRes.data) ? usersRes.data : [],
    teamsOk: teamsRes.ok,
    tasksOk: tasksRes.ok,
    sprintsOk: sprintsRes.ok,
    usersOk: usersRes.ok,
  };
}

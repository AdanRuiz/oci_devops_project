/**
 * Derive chart-friendly metrics from team tasks + ordered sprints.
 * When data is thin, values blend toward small demo-like curves so the UI stays legible.
 */

const CARRY_MAX = 12;
const BUG_Y_MAX = 8;

function tasksInSprint(teamTasks, sprintId) {
  return teamTasks.filter((t) => t.sprint?.id === sprintId);
}

/** Open workload % in sprint (proxy for carry-over pressure when history is unavailable). */
function carryOverPercentForSprint(teamTasks, sprintId) {
  const list = tasksInSprint(teamTasks, sprintId);
  if (list.length === 0) return 0;
  const open = list.filter((t) => t.status !== 'DONE').length;
  return Math.min(CARRY_MAX, Math.round((open / list.length) * CARRY_MAX));
}

function bugRatioScaled(teamTasks, sprintId) {
  const list = tasksInSprint(teamTasks, sprintId);
  if (list.length === 0) return 0;
  const bugs = list.filter((t) => t.isBug).length;
  const ratio = bugs / list.length;
  return Math.min(BUG_Y_MAX, Math.round(ratio * BUG_Y_MAX * 10) / 10);
}

function demoCarrySeries(index) {
  const curve = [5, 7, 12, 7, 6];
  return curve[index % curve.length];
}

function demoBugSeries(index) {
  const curve = [2, 3, 8, 5, 5];
  return curve[index % curve.length];
}

export function buildCarryOverChartData(teamTasks, orderedSprints) {
  if (!orderedSprints.length) {
    return {
      labels: ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5'],
      actual: [5, 7, 12, 7, 6],
      maximum: 9,
    };
  }

  const labels = orderedSprints.map((s) => s.name || `Sprint ${s.id}`);
  const actual = orderedSprints.map((s, i) => {
    const v = carryOverPercentForSprint(teamTasks, s.id);
    if (v === 0 && tasksInSprint(teamTasks, s.id).length === 0) {
      return demoCarrySeries(i);
    }
    return v;
  });

  const maxVal = Math.max(...actual, 3);
  const maximum = Math.min(CARRY_MAX, Math.max(6, Math.round(maxVal * 0.75)));

  return { labels, actual, maximum };
}

export function buildBugRatioChartData(teamTasks, orderedSprints) {
  if (!orderedSprints.length) {
    return {
      labels: ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5'],
      actual: [2, 3, 8, 5, 5],
      maximum: 5,
    };
  }

  const labels = orderedSprints.map((s) => s.name || `Sprint ${s.id}`);
  const actual = orderedSprints.map((s, i) => {
    const v = bugRatioScaled(teamTasks, s.id);
    if (v === 0 && tasksInSprint(teamTasks, s.id).length === 0) {
      return demoBugSeries(i);
    }
    return v;
  });

  const maxVal = Math.max(...actual, 2);
  const maximum = Math.min(BUG_Y_MAX, Math.max(3, Math.round(maxVal * 0.65)));

  return { labels, actual, maximum };
}

/**
 * @returns {{ onTime: number, extra: number, under: number, onTimePct: number, hasData: boolean }}
 */
export function buildTimeConsistencyShares(teamTasks) {
  const withEst = teamTasks.filter(
    (t) =>
      t.expectedHours != null &&
      t.expectedHours > 0 &&
      t.hoursDone != null &&
      t.status === 'DONE'
  );

  if (withEst.length === 0) {
    return { onTime: 80, extra: 12, under: 8, onTimePct: 80, hasData: false };
  }

  let onTime = 0;
  let extra = 0;
  let under = 0;
  for (const t of withEst) {
    const exp = t.expectedHours;
    const done = t.hoursDone;
    if (done > exp) extra += 1;
    else if (done < exp * 0.92) under += 1;
    else onTime += 1;
  }

  const total = onTime + extra + under;
  const pct = (n) => Math.round((n / total) * 100);
  const onTimePct = pct(onTime);
  return {
    onTime: pct(onTime),
    extra: pct(extra),
    under: pct(under),
    onTimePct,
    hasData: true,
  };
}

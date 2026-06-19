import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ── Mock data (swap for real API when backend is ready) ──────────────────────
const SPRINT_DATA = [
  { dev: 'Ana G.',    s1: 5, s2: 6, s3: 4, h1: 14, h2: 16, h3: 12 },
  { dev: 'Carlos L.', s1: 3, s2: 5, s3: 6, h1: 11, h2: 14, h3: 13 },
  { dev: 'Maria R.',  s1: 7, s2: 4, s3: 5, h1: 18, h2: 15, h3: 18 },
  { dev: 'Jorge M.',  s1: 4, s2: 7, s3: 3, h1: 10, h2: 16, h3:  9 },
  { dev: 'Sofia C.',  s1: 6, s2: 5, s3: 8, h1: 15, h2: 14, h3: 17 },
];

// ── Derived KPIs ─────────────────────────────────────────────────────────────
const totalTasks = SPRINT_DATA.reduce((acc, d) => acc + d.s1 + d.s2 + d.s3, 0);
const totalHours = SPRINT_DATA.reduce((acc, d) => acc + d.h1 + d.h2 + d.h3, 0);
const avgTasksDev = (totalTasks / SPRINT_DATA.length).toFixed(1);
const avgHoursDev = (totalHours / SPRINT_DATA.length).toFixed(1);

const KPI_CARDS = [
  { label: '# Tasks',       value: totalTasks,       color: '#7C3AED', bg: '#EDE9FE' },
  { label: 'Real Hours',    value: `${totalHours}h`, color: '#F59E0B', bg: '#FEF3C7' },
  { label: 'Tasks / Dev',   value: avgTasksDev,       color: '#14B8A6', bg: '#CCFBF1' },
  { label: 'Hours / Dev',   value: `${avgHoursDev}h`,color: '#EC4899', bg: '#FCE7F3' },
];

// ── Auto-generated insights from data ────────────────────────────────────────
function generateInsights() {
  const withTotals = SPRINT_DATA.map(d => ({
    ...d,
    totalTasks: d.s1 + d.s2 + d.s3,
    totalHours: d.h1 + d.h2 + d.h3,
    efficiency: (d.s1 + d.s2 + d.s3) / (d.h1 + d.h2 + d.h3),
    trend: d.s3 - d.s1,
  }));

  const topTasks     = [...withTotals].sort((a, b) => b.totalTasks - a.totalTasks)[0];
  const topEff       = [...withTotals].sort((a, b) => b.efficiency - a.efficiency)[0];
  const lowEff       = [...withTotals].sort((a, b) => a.efficiency - b.efficiency)[0];
  const mostImproved = [...withTotals].sort((a, b) => b.trend - a.trend)[0];
  const declining    = [...withTotals].sort((a, b) => a.trend - b.trend)[0];
  const mostHours    = [...withTotals].sort((a, b) => b.totalHours - a.totalHours)[0];
  const leastHours   = [...withTotals].sort((a, b) => a.totalHours - b.totalHours)[0];

  const taskVariance = Math.max(...withTotals.map(d => d.totalTasks)) -
                       Math.min(...withTotals.map(d => d.totalTasks));

  const insights = [
    {
      type: 'success',
      tag: 'Top Performer',
      title: `${topTasks.dev} leads in productivity`,
      body: `Completed ${topTasks.totalTasks} tasks in total — the highest count on the team.`,
    },
    {
      type: 'info',
      tag: 'Efficiency',
      title: `${topEff.dev} is the most efficient`,
      body: `Achieves ${topEff.efficiency.toFixed(2)} tasks/hour — the best output-to-time ratio on the team.`,
    },
    {
      type: 'warning',
      tag: 'Watch',
      title: `${lowEff.dev} has the lowest efficiency`,
      body: `Only ${lowEff.efficiency.toFixed(2)} tasks/hour. May be facing technical blockers or handling higher-complexity work.`,
    },
    mostImproved.trend > 0 ? {
      type: 'success',
      tag: 'Positive Trend',
      title: `${mostImproved.dev} is improving sprint over sprint`,
      body: `Increased by ${mostImproved.trend} tasks from Sprint 1 to Sprint 3 — a strong learning curve.`,
    } : null,
    declining.trend < 0 ? {
      type: 'danger',
      tag: 'Declining Trend',
      title: `${declining.dev} shows a drop in output`,
      body: `Down ${Math.abs(declining.trend)} tasks from Sprint 1 to Sprint 3. Needs follow-up.`,
    } : null,
    taskVariance >= 4 ? {
      type: 'warning',
      tag: 'Imbalance',
      title: `High variance across developers`,
      body: `There is a ${taskVariance}-task gap between the highest and lowest contributor. Workload may not be evenly distributed.`,
    } : null,
    {
      type: 'info',
      tag: 'Workload',
      title: `${mostHours.dev} is logging the most hours`,
      body: `${mostHours.totalHours}h total vs ${leastHours.totalHours}h for ${leastHours.dev} — a ${mostHours.totalHours - leastHours.totalHours}h gap that may signal uneven task assignment.`,
    },
  ].filter(Boolean);

  const actions = [
    {
      priority: 'High',
      color: '#EF4444',
      bg: '#FEF2F2',
      text: `Set up pair programming sessions between ${topEff.dev} and ${lowEff.dev} to share best practices and unblock bottlenecks.`,
    },
    {
      priority: 'High',
      color: '#EF4444',
      bg: '#FEF2F2',
      text: declining.trend < 0
        ? `Schedule a 1-on-1 with ${declining.dev} to identify what caused the drop from Sprint 1 to Sprint 3 before the next sprint begins.`
        : `Review task distribution — ensure no developer is assigned more than 130% of the team average.`,
    },
    {
      priority: 'Medium',
      color: '#F59E0B',
      bg: '#FEF3C7',
      text: `Rebalance workload between ${mostHours.dev} and ${leastHours.dev} in the next sprint — the ${mostHours.totalHours - leastHours.totalHours}h difference is a burnout risk.`,
    },
    {
      priority: 'Medium',
      color: '#F59E0B',
      bg: '#FEF3C7',
      text: `Use ${topTasks.dev}'s estimates as a baseline reference when assigning story points to the team.`,
    },
    {
      priority: 'Low',
      color: '#14B8A6',
      bg: '#CCFBF1',
      text: `Publicly acknowledge ${mostImproved.dev}'s progress in the retrospective — reinforces a culture of continuous improvement.`,
    },
  ];

  return { insights, actions };
}

// ── Tooltips ─────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }}>{p.name}: <strong>{p.value} tasks</strong></p>
      ))}
    </div>
  );
};

const HoursTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }}>{p.name}: <strong>{p.value}h</strong></p>
      ))}
    </div>
  );
};

const INSIGHT_STYLES = {
  success: { border: '#22C55E', bg: '#F0FDF4', tag: '#16A34A' },
  info:    { border: '#3B82F6', bg: '#EFF6FF', tag: '#1D4ED8' },
  warning: { border: '#F59E0B', bg: '#FFFBEB', tag: '#B45309' },
  danger:  { border: '#EF4444', bg: '#FEF2F2', tag: '#B91C1C' },
};

// ── Component ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const { insights, actions } = generateInsights();

  return (
    <div className="dashboard">

      {/* KPI Cards */}
      <div className="kpi-grid">
        {KPI_CARDS.map(card => (
          <div className="kpi-card" key={card.label}
            style={{ '--kpi-color': card.color, '--kpi-bg': card.bg }}>
            <span className="kpi-value">{card.value}</span>
            <span className="kpi-label">{card.label}</span>
          </div>
        ))}
      </div>

      {/* Chart 1 — Tasks by developer/sprint */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Completed Tasks by Developer</h3>
          <p>Comparative analysis per sprint</p>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={SPRINT_DATA} margin={{ top: 10, right: 8, left: -24, bottom: 0 }} barGap={3} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE9FE" vertical={false} />
              <XAxis dataKey="dev" tick={{ fontSize: 11, fontFamily: 'Poppins', fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'Poppins', fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.04)' }} />
              <Legend wrapperStyle={{ fontFamily: 'Poppins', fontSize: '11px', paddingTop: '12px' }} />
              <Bar dataKey="s1" name="Sprint 1" fill="#7C3AED" radius={[6, 6, 0, 0]} maxBarSize={22} />
              <Bar dataKey="s2" name="Sprint 2" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={22} />
              <Bar dataKey="s3" name="Sprint 3" fill="#14B8A6" radius={[6, 6, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2 — Real hours by developer/sprint */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Real Hours by Developer</h3>
          <p>Comparative analysis per sprint</p>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={SPRINT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE9FE" vertical={false} />
              <XAxis dataKey="dev" tick={{ fontSize: 12, fontFamily: 'Poppins', fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'Poppins', fill: '#9CA3AF' }} axisLine={false} tickLine={false} unit="h" />
              <Tooltip content={<HoursTooltip />} cursor={{ fill: 'rgba(124,58,237,0.04)' }} />
              <Legend wrapperStyle={{ fontFamily: 'Poppins', fontSize: '12px', paddingTop: '16px' }} />
              <Bar dataKey="h1" name="Sprint 1" fill="#7C3AED" radius={[6, 6, 0, 0]} maxBarSize={24} />
              <Bar dataKey="h2" name="Sprint 2" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={24} />
              <Bar dataKey="h3" name="Sprint 3" fill="#14B8A6" radius={[6, 6, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <div className="insights-header">
          <h3>Insights</h3>
          <p>Patterns automatically detected from the data</p>
        </div>
        <div className="insights-grid">
          {insights.map((ins, i) => {
            const s = INSIGHT_STYLES[ins.type];
            return (
              <div className="insight-card" key={i}
                style={{ '--ins-border': s.border, '--ins-bg': s.bg, '--ins-tag': s.tag }}>
                <span className="insight-tag">{ins.tag}</span>
                <p className="insight-title">{ins.title}</p>
                <p className="insight-body">{ins.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Improvement Actions */}
      <div className="insights-section">
        <div className="insights-header">
          <h3>Improvement Actions</h3>
          <p>Concrete recommendations for the next sprint</p>
        </div>
        <div className="actions-list">
          {actions.map((action, i) => (
            <div className="action-item" key={i}
              style={{ '--act-color': action.color, '--act-bg': action.bg }}>
              <span className="action-priority">{action.priority}</span>
              <p className="action-text">{action.text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;

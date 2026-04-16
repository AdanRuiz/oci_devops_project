import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { CircularProgress } from '@mui/material';

const SPRINT_COLORS = ['#7C3AED', '#F59E0B', '#14B8A6', '#EC4899', '#3B82F6'];

// ── Tooltips ──────────────────────────────────────────────────────────────────
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

// ── Transform flat API rows → chart-ready data ────────────────────────────────
// API rows: [{ DEVELOPER, SPRINT_NAME, TASKS_COMPLETED, REAL_HOURS }, ...]
// Output:   { sprints: ['Sprint 1', ...], chartData: [{ dev, 'Sprint 1_tasks', ... }] }
function transformData(rows) {
  const sprintOrder = [];
  rows.forEach(r => {
    if (!sprintOrder.includes(r.SPRINT_NAME)) sprintOrder.push(r.SPRINT_NAME);
  });

  const devMap = {};
  rows.forEach(r => {
    if (!devMap[r.DEVELOPER]) devMap[r.DEVELOPER] = { dev: r.DEVELOPER };
    devMap[r.DEVELOPER][r.SPRINT_NAME + '_tasks'] = Number(r.TASKS_COMPLETED);
    devMap[r.DEVELOPER][r.SPRINT_NAME + '_hours'] = parseFloat(Number(r.REAL_HOURS).toFixed(1));
  });

  return { sprints: sprintOrder, chartData: Object.values(devMap) };
}

// ── Auto-generated insights ───────────────────────────────────────────────────
function generateInsights(chartData, sprints) {
  if (!chartData.length || !sprints.length) return { insights: [], actions: [] };

  const withTotals = chartData.map(d => {
    const totalTasks = sprints.reduce((s, sp) => s + (d[sp + '_tasks'] || 0), 0);
    const totalHours = sprints.reduce((s, sp) => s + (d[sp + '_hours'] || 0), 0);
    const first = sprints[0], last = sprints[sprints.length - 1];
    return {
      ...d, totalTasks, totalHours,
      efficiency: totalHours > 0 ? totalTasks / totalHours : 0,
      trend: (d[last + '_tasks'] || 0) - (d[first + '_tasks'] || 0),
    };
  });

  const topTasks     = [...withTotals].sort((a, b) => b.totalTasks - a.totalTasks)[0];
  const topEff       = [...withTotals].sort((a, b) => b.efficiency - a.efficiency)[0];
  const lowEff       = [...withTotals].sort((a, b) => a.efficiency - b.efficiency)[0];
  const mostImproved = [...withTotals].sort((a, b) => b.trend - a.trend)[0];
  const declining    = [...withTotals].sort((a, b) => a.trend - b.trend)[0];
  const mostHours    = [...withTotals].sort((a, b) => b.totalHours - a.totalHours)[0];
  const leastHours   = [...withTotals].sort((a, b) => a.totalHours - b.totalHours)[0];
  const taskVariance = Math.max(...withTotals.map(d => d.totalTasks)) -
                       Math.min(...withTotals.map(d => d.totalTasks));
  const many = withTotals.length > 1;

  const insights = [
    {
      type: 'success', tag: 'Top Performer',
      title: `${topTasks.dev} leads in productivity`,
      body: `Completed ${topTasks.totalTasks} tasks in total — the highest count on the team.`,
    },
    many && {
      type: 'info', tag: 'Efficiency',
      title: `${topEff.dev} is the most efficient`,
      body: `Achieves ${topEff.efficiency.toFixed(2)} tasks/hour — the best output-to-time ratio on the team.`,
    },
    many && lowEff.dev !== topEff.dev && {
      type: 'warning', tag: 'Watch',
      title: `${lowEff.dev} has the lowest efficiency`,
      body: `Only ${lowEff.efficiency.toFixed(2)} tasks/hour. May be facing blockers or handling more complex work.`,
    },
    sprints.length > 1 && mostImproved.trend > 0 && {
      type: 'success', tag: 'Positive Trend',
      title: `${mostImproved.dev} is improving sprint over sprint`,
      body: `Increased by ${mostImproved.trend} tasks from ${sprints[0]} to ${sprints[sprints.length - 1]}.`,
    },
    sprints.length > 1 && declining.trend < 0 && {
      type: 'danger', tag: 'Declining Trend',
      title: `${declining.dev} shows a drop in output`,
      body: `Down ${Math.abs(declining.trend)} tasks from ${sprints[0]} to ${sprints[sprints.length - 1]}. Needs follow-up.`,
    },
    taskVariance >= 4 && {
      type: 'warning', tag: 'Imbalance',
      title: 'High variance across developers',
      body: `There is a ${taskVariance}-task gap between the highest and lowest contributor. Workload may not be evenly distributed.`,
    },
    many && {
      type: 'info', tag: 'Workload',
      title: `${mostHours.dev} is logging the most hours`,
      body: `${mostHours.totalHours.toFixed(1)}h vs ${leastHours.totalHours.toFixed(1)}h for ${leastHours.dev} — a ${(mostHours.totalHours - leastHours.totalHours).toFixed(1)}h gap.`,
    },
  ].filter(Boolean);

  const actions = [
    many && {
      priority: 'High', color: '#EF4444', bg: '#FEF2F2',
      text: `Set up pair programming sessions between ${topEff.dev} and ${lowEff.dev} to share best practices and unblock bottlenecks.`,
    },
    sprints.length > 1 && declining.trend < 0 && {
      priority: 'High', color: '#EF4444', bg: '#FEF2F2',
      text: `Schedule a 1-on-1 with ${declining.dev} to identify what caused the drop before the next sprint begins.`,
    },
    many && {
      priority: 'Medium', color: '#F59E0B', bg: '#FEF3C7',
      text: `Rebalance workload between ${mostHours.dev} and ${leastHours.dev} — the ${(mostHours.totalHours - leastHours.totalHours).toFixed(1)}h difference is a burnout risk.`,
    },
    {
      priority: 'Low', color: '#14B8A6', bg: '#CCFBF1',
      text: sprints.length > 1 && mostImproved.trend > 0
        ? `Publicly acknowledge ${mostImproved.dev}'s progress in the retrospective — reinforces a culture of continuous improvement.`
        : `Use ${topTasks.dev}'s estimates as a baseline reference when assigning story points to the team.`,
    },
  ].filter(Boolean);

  return { insights, actions };
}

// ── Component ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [kpis, setKpis] = useState({ totalTasks: 0, totalHours: 0, avgTasksPerDev: 0, avgHoursPerDev: 0 });
  const [chartData, setChartData] = useState([]);
  const [sprints,   setSprints]   = useState([]);

  useEffect(() => {
    fetch('/analytics/dashboard')
      .then(res => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then(data => {
        setKpis(data.kpis);
        const { sprints: sp, chartData: cd } = transformData(data.chartData);
        setSprints(sp);
        setChartData(cd);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const KPI_CARDS = [
    { label: '# Tasks',      value: kpis.totalTasks,              color: '#7C3AED', bg: '#EDE9FE' },
    { label: 'Real Hours',   value: `${kpis.totalHours}h`,        color: '#F59E0B', bg: '#FEF3C7' },
    { label: 'Tasks / Dev',  value: kpis.avgTasksPerDev,          color: '#14B8A6', bg: '#CCFBF1' },
    { label: 'Hours / Dev',  value: `${kpis.avgHoursPerDev}h`,   color: '#EC4899', bg: '#FCE7F3' },
  ];

  const { insights, actions } = generateInsights(chartData, sprints);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-wrap" style={{ paddingTop: 60 }}>
        <CircularProgress size={32} style={{ color: '#7C3AED' }} />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="empty-state" style={{ paddingTop: 40 }}>
        <p style={{ color: '#EF4444', fontWeight: 600 }}>Could not load analytics</p>
        <p style={{ fontSize: 13, marginTop: 8, color: '#9CA3AF' }}>{error}</p>
      </div>
    );
  }

  // ── No data yet ────────────────────────────────────────────────────────────
  if (chartData.length === 0) {
    return (
      <>
        <div className="kpi-grid">
          {KPI_CARDS.map(card => (
            <div className="kpi-card" key={card.label}
              style={{ '--kpi-color': card.color, '--kpi-bg': card.bg }}>
              <span className="kpi-value">{card.value}</span>
              <span className="kpi-label">{card.label}</span>
            </div>
          ))}
        </div>
        <div className="empty-state" style={{ paddingTop: 32 }}>
          No completed tasks found yet. Complete tasks and log hours to see analytics.
        </div>
      </>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
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

      {/* Chart 1 — Tasks completadas por developer/sprint */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Completed Tasks by Developer</h3>
          <p>Comparative analysis per sprint</p>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 8, left: -24, bottom: 0 }} barGap={3} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE9FE" vertical={false} />
              <XAxis dataKey="dev" tick={{ fontSize: 11, fontFamily: 'Poppins', fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'Poppins', fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.04)' }} />
              <Legend wrapperStyle={{ fontFamily: 'Poppins', fontSize: '11px', paddingTop: '12px' }} />
              {sprints.map((sprint, i) => (
                <Bar key={sprint} dataKey={`${sprint}_tasks`} name={sprint}
                  fill={SPRINT_COLORS[i % SPRINT_COLORS.length]}
                  radius={[6, 6, 0, 0]} maxBarSize={22} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2 — Horas reales por developer/sprint */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Real Hours by Developer</h3>
          <p>Comparative analysis per sprint</p>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE9FE" vertical={false} />
              <XAxis dataKey="dev" tick={{ fontSize: 12, fontFamily: 'Poppins', fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'Poppins', fill: '#9CA3AF' }} axisLine={false} tickLine={false} unit="h" />
              <Tooltip content={<HoursTooltip />} cursor={{ fill: 'rgba(124,58,237,0.04)' }} />
              <Legend wrapperStyle={{ fontFamily: 'Poppins', fontSize: '12px', paddingTop: '16px' }} />
              {sprints.map((sprint, i) => (
                <Bar key={sprint} dataKey={`${sprint}_hours`} name={sprint}
                  fill={SPRINT_COLORS[i % SPRINT_COLORS.length]}
                  radius={[6, 6, 0, 0]} maxBarSize={24} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
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
      )}

      {/* Improvement Actions */}
      {actions.length > 0 && (
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
      )}

    </div>
  );
}

export default Dashboard;

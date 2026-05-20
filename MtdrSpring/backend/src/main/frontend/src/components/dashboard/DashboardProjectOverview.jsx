import { useMemo } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { useOutletContext } from 'react-router-dom';
import DashboardSection from './DashboardSection';
import {
  buildThresholdLineChartData,
  buildTimeConsistencyDoughnutData,
  projectDoughnutColors,
  projectThresholdLineOptions,
  timeConsistencyDoughnutOptions,
} from './dashboardCharts';
import { buildBugRatioChartData, buildCarryOverChartData, buildTimeConsistencyShares } from './projectMetrics';

function MetricShell({ title, subtitle, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-[#2A1814]/[0.06] bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <DashboardSection title={title} subtitle={subtitle}>
        {children}
      </DashboardSection>
    </div>
  );
}

function DashboardProjectOverview() {
  const { teamTasks, orderedSprints } = useOutletContext();

  const carry = useMemo(() => buildCarryOverChartData(teamTasks, orderedSprints), [teamTasks, orderedSprints]);
  const bugs = useMemo(() => buildBugRatioChartData(teamTasks, orderedSprints), [teamTasks, orderedSprints]);
  const shares = useMemo(() => buildTimeConsistencyShares(teamTasks), [teamTasks]);

  const carryData = useMemo(
    () =>
      buildThresholdLineChartData(
        carry.labels,
        carry.actual,
        carry.maximum,
        'Actual',
        'Maximum'
      ),
    [carry]
  );

  const bugData = useMemo(
    () =>
      buildThresholdLineChartData(
        bugs.labels,
        bugs.actual,
        bugs.maximum,
        'Actual',
        'Maximum limit'
      ),
    [bugs]
  );

  const doughnutData = useMemo(() => buildTimeConsistencyDoughnutData(shares), [shares]);

  const carryOptions = useMemo(() => projectThresholdLineOptions(12), []);
  const bugOptions = useMemo(() => projectThresholdLineOptions(8), []);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricShell title="Carry-over percentage" subtitle="Tasks moved to next sprint (estimated from open work per sprint)">
          <div className="h-56 [&_canvas]:bg-transparent">
            <Line data={carryData} options={carryOptions} />
          </div>
        </MetricShell>

        <MetricShell title="Task time consistency" subtitle="Completed tasks vs estimated hours">
          <div className="relative flex flex-col items-center">
            <span
              className="mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: projectDoughnutColors.teal }}
            >
              {shares.hasData && shares.onTimePct >= 85 ? '>85%' : `${shares.onTimePct}% on time`}
            </span>
            <div className="mx-auto h-52 w-full max-w-[220px] [&_canvas]:bg-transparent">
              <Doughnut data={doughnutData} options={timeConsistencyDoughnutOptions} />
            </div>
            {!shares.hasData && (
              <p className="mt-2 text-center text-xs text-[#6B6560]">
                Sample split shown until enough completed tasks include estimates.
              </p>
            )}
          </div>
        </MetricShell>
      </div>

      <MetricShell title="Bug ratio per sprint" subtitle="Quality assurance tracking" className="w-full">
        <div className="h-56 [&_canvas]:bg-transparent">
          <Line data={bugData} options={bugOptions} />
        </div>
      </MetricShell>
    </div>
  );
}

export default DashboardProjectOverview;

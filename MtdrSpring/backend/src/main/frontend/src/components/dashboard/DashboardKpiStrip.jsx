import { Fragment } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

function TrendBadge({ direction, label }) {
  const isUp = direction === 'up';
  const Icon = isUp ? TrendingUp : TrendingDown;
  const colorClass = isUp ? 'text-emerald-600' : 'text-red-500';

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${colorClass}`}>
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {label}
    </span>
  );
}

function KpiCell({ icon: Icon, label, value, trend }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-4 px-2 py-5 sm:px-4 sm:py-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2A1814]/[0.05] text-[#2A1814]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#2A1814]">{label}</p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-2xl font-semibold tracking-tight text-[#2A1814]">{value}</span>
          {trend && <TrendBadge direction={trend.direction} label={trend.label} />}
        </div>
        <p className="mt-1 text-xs text-[#6B6560]">vs last month</p>
      </div>
    </div>
  );
}

function KpiDivider() {
  return (
    <div className="hidden shrink-0 items-center px-6 sm:flex sm:px-8" aria-hidden>
      <div className="h-12 w-px bg-[#2A1814]/[0.08]" />
    </div>
  );
}

function DashboardKpiStrip({ items }) {
  return (
    <section className="border-y border-[#2A1814]/[0.08]">
      <div className="flex flex-col sm:flex-row sm:items-stretch sm:px-2">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && (
              <>
                <div className="mx-4 h-px bg-[#2A1814]/[0.08] sm:hidden" aria-hidden />
                <KpiDivider />
              </>
            )}
            <KpiCell {...item} />
          </Fragment>
        ))}
      </div>
    </section>
  );
}

export default DashboardKpiStrip;

import { dashboardCardClassName } from '../../constants/dashboardTheme';

function DashboardCard({ title, subtitle, children, className = '', headerEnd, footer }) {
  return (
    <article className={`${dashboardCardClassName} p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#2A1814]">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-[#6B6560]">{subtitle}</p>}
        </div>
        {headerEnd}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer}
    </article>
  );
}

export default DashboardCard;

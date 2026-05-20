import { dashboardCardClassName } from '../../constants/dashboardTheme';

function DashboardPlaceholder({ title, description }) {
  return (
    <div className={`${dashboardCardClassName} p-10 text-center`}>
      <h2 className="text-lg font-semibold text-[#2A1814]">{title}</h2>
      <p className="mt-2 text-sm text-[#6B6560]">{description}</p>
    </div>
  );
}

export default DashboardPlaceholder;

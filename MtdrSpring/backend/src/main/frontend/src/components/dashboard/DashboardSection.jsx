function DashboardSection({ title, subtitle, children, headerEnd, className = '' }) {
  return (
    <section className={`dashboard-section-enter ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-[#2A1814]/[0.08] pb-3">
        <div>
          <h2 className="text-sm font-semibold text-[#2A1814]">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-[#6B6560]">{subtitle}</p>}
        </div>
        {headerEnd}
      </div>
      {children}
    </section>
  );
}

export default DashboardSection;

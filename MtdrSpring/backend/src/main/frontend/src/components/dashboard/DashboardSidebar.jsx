import { createElement } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  ClipboardList,
  Home,
  Info,
  LayoutGrid,
  LogOut,
  Users,
} from 'lucide-react';
import { dashboardTopRowClassName } from '../../constants/dashboardTheme';

const mainNav = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/dashboard/projects', label: 'Projects', icon: LayoutGrid },
  { to: '/dashboard/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/dashboard/team', label: 'Team', icon: Users },
  { to: '/dashboard/activity', label: 'Activity', icon: Activity },
];

function navLinkClass({ isActive }) {
  const base =
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors';
  return isActive
    ? `${base} bg-white text-[#2A1814]`
    : `${base} text-[#6B6560] hover:bg-white/60 hover:text-[#2A1814]`;
}

function DashboardSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col bg-[#faf9f6] lg:w-60">
      <div
        className="pointer-events-none absolute right-0 top-10 bottom-12 w-px bg-[#2A1814]/[0.08]"
        aria-hidden
      />

      <div className={`${dashboardTopRowClassName} mt-1 shrink-0 px-6 lg:px-7`}>
        <NavLink to="/" className="inline-flex" aria-label="Lumen home">
          <img src="/lettermark-b.svg" alt="Lumen" className="h-8 w-auto" />
        </NavLink>
      </div>

      <nav className="mt-7 shrink-0 px-4">
        <div className="flex flex-col gap-1">
          {mainNav.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              {createElement(icon, {
                className: 'h-[18px] w-[18px] shrink-0 stroke-[1.75]',
              })}
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="mt-auto shrink-0 border-t border-[#2A1814]/[0.06] px-4 pb-6 pt-5">
        <a
          href="mailto:support@lumen.app"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#6B6560] transition-colors hover:bg-white/60 hover:text-[#2A1814]"
        >
          <Info className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" />
          Help & information
        </a>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#6B6560] transition-colors hover:bg-white/60 hover:text-[#2A1814]"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" />
          Log out
        </button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;

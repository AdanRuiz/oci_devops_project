import { useEffect, useState } from 'react';
import HeaderAccountActions from '../ui/HeaderAccountActions';
import { dashboardTopRowClassName } from '../../constants/dashboardTheme';

const DEFAULT_USER = { firstName: 'Alex', initials: 'AR' };

function getFirstName(name) {
  const trimmed = name?.trim();
  if (!trimmed) return DEFAULT_USER.firstName;
  return trimmed.split(/\s+/)[0];
}

function getInitials(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return DEFAULT_USER.initials;
}

function formatToday() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

function DashboardHeader() {
  const [firstName, setFirstName] = useState(DEFAULT_USER.firstName);
  const [displayName, setDisplayName] = useState('Alex Rivera');
  const [initials, setInitials] = useState(DEFAULT_USER.initials);
  const today = formatToday();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/users');
        if (!res.ok || cancelled) return;
        const users = await res.json();
        const primary = users?.[0];
        if (!primary) return;
        const name = primary.name || primary.username;
        if (!cancelled) {
          setDisplayName(name);
          setFirstName(getFirstName(name));
          setInitials(getInitials(name));
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="relative bg-white px-6 pb-7 lg:px-8 lg:pb-8">
      <div className={`${dashboardTopRowClassName} justify-between gap-4`}>
        <h1 className="m-0 text-xl font-semibold leading-none tracking-tight text-[#2A1814] sm:text-2xl">
          Hello, {firstName}
        </h1>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <p className="m-0 hidden text-sm leading-none text-[#6B6560] md:block">{today}</p>

          <HeaderAccountActions
            variant="manager"
            displayName={displayName}
            initials={initials}
            hoverClass="hover:bg-[#faf9f6]/60"
          />
        </div>
      </div>

      <div
        className="absolute bottom-0 left-6 right-6 h-px bg-[#2A1814]/[0.08] lg:left-8 lg:right-8"
        aria-hidden
      />
    </header>
  );
}

export default DashboardHeader;

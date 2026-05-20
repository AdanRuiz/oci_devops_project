import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Home, LayoutDashboard, ListTodo, LogOut } from 'lucide-react';

const DEFAULT_USER = { displayName: 'Alex Rivera', initials: 'AR' };

function getInitials(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return DEFAULT_USER.initials;
}

/**
 * @param {'dev' | 'manager'} variant
 * @param {string} [displayName]
 * @param {string} [initials]
 * @param {string} [hoverClass] — bell/profile hover background
 */
export default function HeaderAccountActions({
  variant = 'dev',
  displayName: displayNameProp,
  initials: initialsProp,
  hoverClass = 'hover:bg-[#2A1814]/[0.04]',
}) {
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const [displayName, setDisplayName] = useState(displayNameProp ?? DEFAULT_USER.displayName);
  const [initials, setInitials] = useState(initialsProp ?? DEFAULT_USER.initials);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const roleLabel = variant === 'manager' ? 'Manager' : 'Developer';
  const notificationsHint =
    variant === 'manager'
      ? "You're all caught up. Team, sprint, and task alerts will show here."
      : "You're all caught up. Sprint and task alerts will show here.";

  useEffect(() => {
    if (displayNameProp) setDisplayName(displayNameProp);
  }, [displayNameProp]);

  useEffect(() => {
    if (initialsProp) setInitials(initialsProp);
  }, [initialsProp]);

  useEffect(() => {
    if (displayNameProp && initialsProp) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/users');
        if (!res.ok || cancelled) return;
        const users = await res.json();
        const primary = users?.[0];
        if (!primary || cancelled) return;
        const name = primary.name || primary.username || DEFAULT_USER.displayName;
        if (!displayNameProp) setDisplayName(name);
        if (!initialsProp) setInitials(getInitials(name));
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [displayNameProp, initialsProp]);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    function handlePointerDown(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    function handlePointerDown(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setNotificationsOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen]);

  return (
    <>
      <div ref={notificationsRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setNotificationsOpen((open) => !open);
            setProfileMenuOpen(false);
          }}
          className={`relative rounded-full p-2 text-[#6B6560] transition ${hoverClass} hover:text-[#2A1814]`}
          aria-expanded={notificationsOpen}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#c74634]" />
        </button>
        {notificationsOpen && (
          <div className="dashboard-modal-panel-enter absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#2A1814]/10 bg-white p-4 shadow-lg ring-1 ring-black/[0.04]">
            <p className="text-sm font-medium text-[#2A1814]">Notifications</p>
            <p className="mt-2 text-sm text-[#6B6560]">{notificationsHint}</p>
          </div>
        )}
      </div>

      <div ref={profileMenuRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setProfileMenuOpen((open) => !open);
            setNotificationsOpen(false);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c74634]/15 text-sm font-semibold text-[#c74634] transition hover:bg-[#c74634]/25"
          aria-expanded={profileMenuOpen}
          aria-haspopup="menu"
          aria-label="Profile menu"
        >
          {initials}
        </button>

        {profileMenuOpen && (
          <div
            role="menu"
            className="dashboard-modal-panel-enter absolute right-0 top-full z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-[#2A1814]/10 bg-white py-1 shadow-lg ring-1 ring-black/[0.04]"
          >
            <div className="border-b border-[#2A1814]/[0.06] px-3 py-2.5">
              <p className="text-sm font-medium text-[#2A1814]">{displayName}</p>
              <p className="text-xs text-[#6B6560]">{roleLabel}</p>
            </div>
            {variant === 'dev' ? (
              <Link
                to="/dashboard"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#2A1814] transition hover:bg-[#faf9f6]"
                onClick={() => setProfileMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 text-[#6B6560]" />
                Manager dashboard
              </Link>
            ) : (
              <Link
                to="/app"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#2A1814] transition hover:bg-[#faf9f6]"
                onClick={() => setProfileMenuOpen(false)}
              >
                <ListTodo className="h-4 w-4 shrink-0 text-[#6B6560]" />
                Developer view
              </Link>
            )}
            <Link
              to="/"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#2A1814] transition hover:bg-[#faf9f6]"
              onClick={() => setProfileMenuOpen(false)}
            >
              <Home className="h-4 w-4 shrink-0 text-[#6B6560]" />
              Lumen home
            </Link>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#2A1814] transition hover:bg-[#faf9f6]"
              onClick={() => {
                setProfileMenuOpen(false);
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4 shrink-0 text-[#6B6560]" />
              Log out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

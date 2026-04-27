import { AppBar, Box, Button, Toolbar, Tooltip, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useActiveProject } from '../../models/ProjectContext';
import { useCurrentUser } from '../../models/CurrentUserContext';
import bannerImage from '../../assets/redwood-banner.png';
import { ReactComponent as DashboardSvg } from '../../assets/nav-bar/dashboard.svg';
import { ReactComponent as KanbanSvg } from '../../assets/nav-bar/kanban.svg';
import { ReactComponent as SprintsSvg } from '../../assets/nav-bar/sprints.svg';
import { ReactComponent as KpisSvg } from '../../assets/nav-bar/kpis.svg';
import { ReactComponent as ProfileSvg } from '../../assets/nav-bar/profile.svg';
import { ReactComponent as OracleSvg } from '../../assets/nav-bar/oracle.svg';

const STATIC_NAV = [
  { label: 'Dashboard', path: '/dashboard', Icon: DashboardSvg },
  { label: 'Kanban Board', path: '/kanban', Icon: KanbanSvg },
  { label: 'Sprints', path: null, Icon: SprintsSvg },
  { label: 'KPIs', path: '/kpi', Icon: KpisSvg },
  { label: 'Profile', path: '/profile', Icon: ProfileSvg },
];

const PAGE_BG = '#f1efed';
const APPBAR_H = 88;
const BANNER_H = 10;
const NAV_H = 60;

export default function Layout({ children }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const { pathname } = useLocation();
  const { activeProject, clearProject } = useActiveProject();
  const { currentUser } = useCurrentUser();

  const userEmail = currentUser?.email ?? auth.user?.profile?.email ?? '';
  const userRole =
    currentUser?.systemRole === 'PROJECT_MANAGER'
      ? 'Project Manager'
      : currentUser?.systemRole === 'ADMIN'
        ? 'Admin'
        : 'Developer';

  const NAV_ITEMS = STATIC_NAV.map((item) =>
    item.label === 'Sprints' && activeProject
      ? { ...item, path: `/projects/${activeProject.id}` }
      : item
  );

  const currentNav = NAV_ITEMS.findIndex((item, i) => {
    if (!item.path) return false;
    if (pathname === item.path || pathname.startsWith(item.path + '/')) return true;
    // Tasks live under /tasks/:id but belong to the Sprints section
    if (item.label === 'Sprints' && pathname.startsWith('/tasks/')) return true;
    return false;
  });

  const handleSwitchProject = () => {
    clearProject();
    navigate('/projects');
  };

  const handleSignOut = async () => {
    clearProject();
    await auth.removeUser();
    navigate('/auth/sign-in', { replace: true });
  };

  const splitY = APPBAR_H + 32 + BANNER_H;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: `linear-gradient(to bottom, ${PAGE_BG} ${splitY}px, #ffffff ${splitY}px)`,
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: PAGE_BG, boxShadow: 'none', borderBottom: 'none' }}
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            minHeight: `${APPBAR_H}px !important`,
            pl: { xs: 2, sm: '96px' },
            pr: { xs: 2, sm: '96px' },
          }}
        >
          <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.95rem', sm: '1.4rem' },
                color: '#1A1A1A',
                lineHeight: 1.3,
              }}
              noWrap
            >
              {activeProject ? activeProject.name : 'Project Management'}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#717171', mt: '2px' }}>
              {userRole} - {userEmail}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: { xs: '6px', sm: '10px' }, flexShrink: 0 }}>
            {activeProject && (
              <Tooltip title="Go back to project selection">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSwitchProject}
                  sx={{
                    bgcolor: '#ffffff',
                    color: '#2B2B2B',
                    borderColor: '#e0dedc',
                    fontWeight: 500,
                    fontSize: { xs: '0.72rem', sm: '0.85rem' },
                    px: { xs: '10px', sm: '16px' },
                    py: { xs: '4px', sm: '6px' },
                    '&:hover': { bgcolor: '#e0dedc', borderColor: '#e0dedc' },
                  }}
                >
                  Switch Project
                </Button>
              </Tooltip>
            )}
            <Button
              variant="contained"
              size="small"
              onClick={handleSignOut}
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.72rem', sm: '0.85rem' },
                px: { xs: '10px', sm: '18px' },
                py: { xs: '4px', sm: '6px' },
              }}
            >
              Sign Out
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mb: activeProject ? `${NAV_H}px` : 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            mx: { xs: 2, sm: '96px' },
            mt: 0,
            mb: '24px',
            bgcolor: '#fbf9f8',
            borderRadius: '6px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Banner */}
          <Box
            sx={{
              width: '100%',
              height: `${BANNER_H}px`,
              backgroundImage: `url(${bannerImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <Box sx={{ p: { xs: 2.5, sm: 3.5, md: 4 } }}>{children}</Box>
        </Box>
      </Box>

      {/* Custom Bottom Navigation */}
      {activeProject && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${NAV_H}px`,
            bgcolor: '#1C1C1E',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'stretch',
            borderTop: '1px solid #3A3A3C',
          }}
        >
          {/* Nav items */}
          {NAV_ITEMS.map(({ label, path, Icon }, i) => {
            const active = i === currentNav;
            return (
              <Box
                key={label}
                onClick={() => path && navigate(path)}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  gap: '7px',
                  flex: { xs: 1, sm: 'none' },
                  px: { xs: 0, sm: '16px' },
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'transform 0.12s ease, opacity 0.12s ease',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                  '&:active': { transform: 'scale(0.92)', opacity: 0.7 },
                }}
              >
                {/* Orange top indicator for active tab */}
                {active && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -1,
                      left: 0,
                      right: 0,
                      height: '3px',
                      bgcolor: '#E8A535',
                    }}
                  />
                )}

                {/* Icon */}
                <Box
                  sx={{
                    display: 'flex',
                    opacity: active ? 1 : 0.4,
                    '& svg': {
                      width: 18,
                      height: 18,
                      filter: 'brightness(0) invert(1)',
                    },
                  }}
                >
                  <Icon />
                </Box>

                {/* Labels (hidden on mobile) */}
                <Typography
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: active ? '#ffffff' : '#6B6B6B',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Typography>
              </Box>
            );
          })}

          {/* Oracle logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <Box
              sx={{
                display: 'flex',
                '& svg': { height: `${NAV_H}px`, width: 'auto' },
              }}
            >
              <OracleSvg />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

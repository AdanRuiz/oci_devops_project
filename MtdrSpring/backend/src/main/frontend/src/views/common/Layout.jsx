import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import bannerImage from '../../assets/redwood-banner.png';
import { ReactComponent as DashboardSvg }  from '../../assets/nav-bar/dashboard.svg';
import { ReactComponent as ProjectsSvg }   from '../../assets/nav-bar/projects.svg';
import { ReactComponent as KanbanSvg }     from '../../assets/nav-bar/kanban.svg';
import { ReactComponent as SprintsSvg }    from '../../assets/nav-bar/sprints.svg';
import { ReactComponent as KpisSvg }       from '../../assets/nav-bar/kpis.svg';
import { ReactComponent as ProfileSvg }    from '../../assets/nav-bar/profile.svg';
import { ReactComponent as OracleSvg }     from '../../assets/nav-bar/oracle.svg';

const NAV_ITEMS = [
    { label: 'Dashboard',    path: '/dashboard', Icon: DashboardSvg },
    { label: 'Projects',     path: '/projects',  Icon: ProjectsSvg  },
    { label: 'Kanban Board', path: '/kanban',    Icon: KanbanSvg    },
    { label: 'Sprints',      path: '/sprints',   Icon: SprintsSvg   },
    { label: 'KPIs',         path: '/kpi',       Icon: KpisSvg      },
    { label: 'Profile',      path: '/profile',   Icon: ProfileSvg   },
];

const PAGE_BG  = '#f1efed';
const APPBAR_H = 88;
const BANNER_H = 10;
const NAV_H    = 60;

export default function Layout({
    children,
    projectTitle = 'Project Management - Name in Progress',
    userRole     = 'Manager',
    userEmail    = 'baltazar.servin@oracle.com',
}) {
    const navigate   = useNavigate();
    const { pathname } = useLocation();
    const currentNav = NAV_ITEMS.findIndex(
        item => pathname === item.path || pathname.startsWith(item.path + '/')
    );

    const splitY = APPBAR_H + 32 + BANNER_H;

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            background: `linear-gradient(to bottom, ${PAGE_BG} ${splitY}px, #ffffff ${splitY}px)`,
        }}>

            {/* ── AppBar ── */}
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
                            {projectTitle}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: '#717171', mt: '2px' }}>
                            {userRole} - {userEmail}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: { xs: '6px', sm: '10px' }, flexShrink: 0 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{
                                bgcolor: '#e0dedc', color: '#2B2B2B', borderColor: '#e0dedc',
                                textTransform: 'none', fontWeight: 500,
                                fontSize: { xs: '0.72rem', sm: '0.85rem' },
                                px: { xs: '10px', sm: '16px' },
                                py: { xs: '4px', sm: '6px' },
                                borderRadius: '4px', boxShadow: 'none',
                                '&:hover': { bgcolor: '#F5F3F1', borderColor: '#e0dedc', boxShadow: 'none' },
                            }}
                        >
                            Preferences
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            sx={{
                                bgcolor: '#312d2a', color: '#FFFFFF',
                                textTransform: 'none', fontWeight: 700,
                                fontSize: { xs: '0.72rem', sm: '0.85rem' },
                                px: { xs: '10px', sm: '18px' },
                                py: { xs: '4px', sm: '6px' },
                                borderRadius: '4px', boxShadow: 'none',
                                '&:hover': { bgcolor: '#111111', boxShadow: 'none' },
                            }}
                        >
                            Sign Out
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* ── Main content ── */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    mb: `${NAV_H}px`,
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
                    <Box sx={{ p: { xs: 2.5, sm: 3.5, md: 4 } }}>
                        {children}
                    </Box>
                </Box>
            </Box>

            {/* ── Custom Bottom Navigation ── */}
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
                            onClick={() => navigate(path)}
                            sx={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: { xs: 'center', sm: 'flex-start' },
                                gap: '7px',
                                // mobile: evenly share space; desktop: auto width
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
                                <Box sx={{
                                    position: 'absolute',
                                    top: -1,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    bgcolor: '#E8A535',
                                }} />
                            )}

                            {/* Icon */}
                            <Box sx={{
                                display: 'flex',
                                opacity: active ? 1 : 0.4,
                                '& svg': {
                                    width: 18,
                                    height: 18,
                                    filter: 'brightness(0) invert(1)',
                                },
                            }}>
                                <Icon />
                            </Box>

                            {/* Label — hidden on mobile */}
                            <Typography sx={{
                                display: { xs: 'none', sm: 'block' },
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: active ? '#ffffff' : '#6B6B6B',
                                whiteSpace: 'nowrap',
                            }}>
                                {label}
                            </Typography>
                        </Box>
                    );
                })}

                {/* Oracle logo */}
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                    <Box sx={{
                        display: 'flex',
                        '& svg': { height: `${NAV_H}px`, width: 'auto' },
                    }}>
                        <OracleSvg />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

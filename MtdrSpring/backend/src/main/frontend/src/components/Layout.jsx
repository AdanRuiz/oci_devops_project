import {
    AppBar, Box, Drawer, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Toolbar, Typography,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 220;

const NAV_ITEMS = [
    { label: 'Projects',      path: '/projects', icon: <FolderIcon /> },
    { label: 'KPI Dashboard', path: '/kpi',      icon: <BarChartIcon /> },
];

export default function Layout({ children }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap>PM Tool</Typography>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
                }}
            >
                <Toolbar />
                <List>
                    {NAV_ITEMS.map(({ label, path, icon }) => (
                        <ListItem key={path} disablePadding>
                            <ListItemButton
                                selected={pathname.startsWith(path)}
                                onClick={() => navigate(path)}
                            >
                                <ListItemIcon>{icon}</ListItemIcon>
                                <ListItemText primary={label} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}

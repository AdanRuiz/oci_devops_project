import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { ProjectProvider, useActiveProject } from './models/ProjectContext';
import Layout from './views/common/Layout';
import DashboardController from './controllers/DashboardController';
import ProjectSelectorController from './controllers/ProjectSelectorController';
import ProjectDetailController from './controllers/ProjectDetailController';
import SprintBoardController from './controllers/SprintBoardController';
import TaskDetailController from './controllers/TaskDetailController';
import KpiDashboardController from './controllers/KpiDashboardController';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
        },
    },
});

/** Redirect to /projects (selector) if no active project, otherwise to /dashboard. */
function RootRedirect() {
    const { activeProject } = useActiveProject();
    return <Navigate to={activeProject ? '/dashboard' : '/projects'} replace />;
}

/** Guard: pages that require an active project selected. */
function RequireProject({ children }) {
    const { activeProject } = useActiveProject();
    return activeProject ? children : <Navigate to="/projects" replace />;
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <ProjectProvider>
                        <Layout>
                            <Routes>
                                <Route path="/" element={<RootRedirect />} />
                                <Route path="/projects" element={<ProjectSelectorController />} />
                                <Route path="/projects/:projectId" element={<ProjectDetailController />} />
                                <Route path="/projects/:projectId/sprints/:sprintId" element={<SprintBoardController />} />
                                <Route path="/dashboard" element={<RequireProject><DashboardController /></RequireProject>} />
                                <Route path="/tasks/:taskId" element={<RequireProject><TaskDetailController /></RequireProject>} />
                                <Route path="/kpi" element={<RequireProject><KpiDashboardController /></RequireProject>} />
                            </Routes>
                        </Layout>
                    </ProjectProvider>
                </BrowserRouter>
            </QueryClientProvider>
        </ThemeProvider>
    );
}

export default App;

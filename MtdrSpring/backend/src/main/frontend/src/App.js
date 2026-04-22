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
import KanbanBoardController from './controllers/KanbanBoardController';
import ProfileController from './controllers/ProfileController';
import { useAuth } from 'react-oidc-context';
import AuthView, { AuthCallbackRoute } from './controllers/AuthView';
import CreateUserView from './controllers/CreateUserView';

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

function RequireAuth({ children }) {
    const auth = useAuth();

    if (auth.isLoading || auth.activeNavigator) {
        return <div>Loading authentication...</div>;
    }

    if (auth.error) {
        return <div>Authentication error: {auth.error.message}</div>;
    }

    return auth.isAuthenticated ? children : <Navigate to="/auth/sign-in" replace />;
}

function ProtectedAppRoutes() {
    return (
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
                    <Route path="/kanban" element={<KanbanBoardController />} />
                    <Route path="/profile" element={<RequireProject><ProfileController /></RequireProject>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </ProjectProvider>
    );
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/auth/sign-in" element={<AuthView />} />
                        <Route path="/auth/create-user" element={<CreateUserView />} />
                        <Route path="/callback" element={<AuthCallbackRoute />} />
                        <Route
                            path="/*"
                            element={(
                                <RequireAuth>
                                    <ProtectedAppRoutes />
                                </RequireAuth>
                            )}
                        />
                    </Routes>
                </BrowserRouter>
            </QueryClientProvider>
        </ThemeProvider>
    );
}

export default App;

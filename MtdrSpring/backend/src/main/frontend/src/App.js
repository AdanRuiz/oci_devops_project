import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import Layout from './views/common/Layout';
import DashboardController from './controllers/DashboardController';
import ProjectsController from './controllers/ProjectsController';
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

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<DashboardController />} />
                            <Route path="/projects" element={<ProjectsController />} />
                            <Route path="/projects/:projectId" element={<ProjectDetailController />} />
                            <Route path="/projects/:projectId/sprints/:sprintId" element={<SprintBoardController />} />
                            <Route path="/tasks/:taskId" element={<TaskDetailController />} />
                            <Route path="/kpi" element={<KpiDashboardController />} />
                        </Routes>
                    </Layout>
                </BrowserRouter>
            </QueryClientProvider>
        </ThemeProvider>
    );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import SprintBoard from './pages/SprintBoard';
import TaskDetail from './pages/TaskDetail';
import KpiDashboard from './pages/KpiDashboard';

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
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Navigate to="/projects" replace />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/projects/:projectId" element={<ProjectDetail />} />
                        <Route path="/projects/:projectId/sprints/:sprintId" element={<SprintBoard />} />
                        <Route path="/tasks/:taskId" element={<TaskDetail />} />
                        <Route path="/kpi" element={<KpiDashboard />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;

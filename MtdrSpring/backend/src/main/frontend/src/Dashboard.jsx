import { Route, Routes } from 'react-router-dom';
import DashboardHeader from './components/dashboard/DashboardHeader';
import DashboardHome from './components/dashboard/DashboardHome';
import DashboardPlaceholder from './components/dashboard/DashboardPlaceholder';
import DashboardProjectLayout from './components/dashboard/DashboardProjectLayout';
import DashboardProjectOverview from './components/dashboard/DashboardProjectOverview';
import DashboardProjectSprint from './components/dashboard/DashboardProjectSprint';
import DashboardProjects from './components/dashboard/DashboardProjects';
import DashboardSidebar from './components/dashboard/DashboardSidebar';
import { dashboardScrollbarClassName } from './constants/dashboardTheme';

function Dashboard() {
  return (
    <div className="h-screen overflow-hidden bg-white text-[#2A1814]">
      <DashboardSidebar />

      <div className="flex h-full min-w-0 flex-col overflow-hidden pl-56 lg:pl-60">
        <DashboardHeader />
        <main
          className={`${dashboardScrollbarClassName} min-h-0 flex-1 overflow-y-auto bg-white p-6 lg:p-8`}
        >
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="projects" element={<DashboardProjects />} />
            <Route path="projects/:projectId" element={<DashboardProjectLayout />}>
              <Route index element={<DashboardProjectOverview />} />
              <Route path="sprints/:sprintId" element={<DashboardProjectSprint />} />
            </Route>
            <Route
              path="tasks"
              element={
                <DashboardPlaceholder
                  title="Tasks"
                  description="Task management views will appear here."
                />
              }
            />
            <Route
              path="team"
              element={
                <DashboardPlaceholder
                  title="Team"
                  description="Team roster and assignments will appear here."
                />
              }
            />
            <Route
              path="activity"
              element={
                <DashboardPlaceholder
                  title="Activity"
                  description="Full activity feed will appear here."
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

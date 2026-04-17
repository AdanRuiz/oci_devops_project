import { createBrowserRouter } from "react-router";
import RoleSelection from "./pages/RoleSelection";
import ManagerDashboard from "./pages/ManagerDashboard";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import TaskDetailView from "./pages/TaskDetailView";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RoleSelection,
  },
  {
    path: "/manager",
    Component: ManagerDashboard,
  },
  {
    path: "/developer",
    Component: DeveloperDashboard,
  },
  {
    path: "/developer/task/:taskId",
    Component: TaskDetailView,
  },
]);

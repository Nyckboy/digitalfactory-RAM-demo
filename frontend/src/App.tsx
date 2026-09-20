import { RouterProvider, createBrowserRouter, Navigate } from "react-router";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Login } from "./pages/auth/Login";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { SupervisorDashboard } from "./pages/supervisor/SupervisorDashboard";
import { ProjectTaskBoard } from "./pages/supervisor/ProjectTaskBoard";
import { InternDashboard } from "./pages/intern/InternDashboard";
import { TeamView } from "./pages/admin/TeamView";
import { ProjectsView } from "./pages/admin/ProjectsView";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { SupervisorLayout } from "./pages/supervisor/SupervisorLayout";
import { SupervisorProjectsView } from "./pages/supervisor/SupervisorProjectsView";
import { SupervisorTeamView } from "./pages/supervisor/SupervisorTeamView";
import { InternLayout } from "./pages/intern/InternLayout";
import { InternTaskBoard } from "./pages/intern/InternTaskBoard";
import { NotificationProvider } from "./context/NotificationContext";
import { DemoToolbar } from "./demo/DemoToolbar";
import { Toaster } from "sonner";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Navigate to="/login" replace />,
      },
      // Super Admin Routes
      {
        element: <ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />, // <-- Layout wraps the nested routes
            children: [
              { index: true, element: <AdminDashboard /> }, // Renders at /admin
              { path: "projects", element: <ProjectsView /> }, // Renders at /admin/projects
              { path: "team", element: <TeamView /> }, // Renders at /admin/team
            ],
          },
        ],
      },
      // Supervisor Routes
      {
        element: <ProtectedRoute allowedRoles={["SUPERVISOR"]} />,
        children: [
          {
            path: "/supervisor",
            element: <SupervisorLayout />,
            children: [
              { index: true, element: <SupervisorDashboard /> },
              { path: "projects", element: <SupervisorProjectsView /> },
              { path: "team", element: <SupervisorTeamView /> },
              {
                path: "projects/:projectId/board",
                element: <ProjectTaskBoard />,
              },
            ],
          },
        ],
      },
      // Intern Routes
      {
        element: <ProtectedRoute allowedRoles={["INTERN"]} />,
        children: [
          {
            path: "/intern",
            element: <InternLayout />,
            children: [
              { index: true, element: <InternDashboard /> },
              { path: "tasks", element: <InternTaskBoard /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: (
      <div className="p-10 text-center text-red-500">404 - Page Not Found</div>
    ),
  },
]);

export default function App() {
  return (
    <NotificationProvider>
      <Toaster richColors position="top-right" />
      <div className="pb-24"><RouterProvider router={router} /></div>
      <DemoToolbar />
    </NotificationProvider>
  );
}

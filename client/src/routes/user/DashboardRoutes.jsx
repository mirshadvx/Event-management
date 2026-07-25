import { lazy } from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";
import OrganizerProtectedRoute from "./OrganizerProtectedRoute";

const Dashboard = lazy(() => import("../../pages/User/Dashboard/Dashboard"));
const Participated_Outlet = lazy(() => import("../../components/layout/user/Dashboard/Participated_Outlet"));
const Organized_Outlet = lazy(() => import("../../components/layout/user/Dashboard/Organized_Outlet"));
const CreateEvent_Outlet = lazy(() => import("@/components/layout/user/Dashboard/CreateEvent_Outlet"));

const DashboardRoutes = () => {
  return (
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    >
      <Route path="participated" element={<Participated_Outlet />} />
      <Route index element={<Participated_Outlet />} />
      <Route
        path="organized"
        element={
          <OrganizerProtectedRoute>
            <Organized_Outlet />
          </OrganizerProtectedRoute>
        }
      />
      <Route
        path="create-event"
        element={
          <OrganizerProtectedRoute>
            <CreateEvent_Outlet />
          </OrganizerProtectedRoute>
        }
      />
    </Route>
  );
};

export default DashboardRoutes;
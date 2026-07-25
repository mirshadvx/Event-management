import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import LoadingScreen from "@/components/common/LoadingScreen";

const Admin_ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, role } = useSelector((state) => state.user);
  console.log("Admin protect route test", { isAuthenticated, role, loading });

  if (loading) {
    return <LoadingScreen message="Checking admin access" />;
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to admin login");
    return <Navigate to="/admin/login" replace />;
  }

  if (!role.admin) {
    console.log("Not an admin, redirecting to admin login");
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default Admin_ProtectedRoute;

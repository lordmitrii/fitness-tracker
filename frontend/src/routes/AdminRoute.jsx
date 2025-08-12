import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = () => {
  const { loading, hasAnyRole } = useAuth();

  if (loading) return null;

  return hasAnyRole(["admin"]) ? <Outlet /> : <Navigate to="/forbidden" />;
};

export default AdminRoute;

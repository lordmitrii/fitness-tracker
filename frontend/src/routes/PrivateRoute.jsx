import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = () => {
  const { isAuth, loading, hasRole } = useAuth();
  const hasRestrictedRole = hasRole("restricted");

  if (loading) return null;

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (hasRestrictedRole) {
    return <Navigate to="/account-verification" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
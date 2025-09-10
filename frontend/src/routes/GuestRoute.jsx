import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const GuestRoute = () => {
  const { isAuth, loading } = useAuth();

  if (loading) return null;

  return isAuth ? <Navigate to="/" replace /> : <Outlet />;
};

export default GuestRoute;

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../states/LoadingState";

export const PrivateRoute = () => {
  const { isAuth, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Checking authentication..." />;
  }

  return isAuth ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;

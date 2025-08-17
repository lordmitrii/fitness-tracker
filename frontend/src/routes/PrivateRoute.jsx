import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = () => {
  const { isAuth, loading } = useAuth();
  

  if (loading) return null;

  return isAuth ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;

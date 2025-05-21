import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const PrivateRoute = () => {
  const { isAuth, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; 
  }

  return isAuth ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;

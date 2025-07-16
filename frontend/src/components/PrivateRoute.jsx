import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../states/LoadingState";
import { useTranslation } from "react-i18next";

export const PrivateRoute = () => {
  const { t } = useTranslation();
  const { isAuth, loading } = useAuth();

  if (loading) {
    return <LoadingState message={t("private_route.checking_auth")} />;
  }

  return isAuth ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;

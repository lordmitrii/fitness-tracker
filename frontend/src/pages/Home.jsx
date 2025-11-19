import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import { Link } from "react-router-dom";
import InstallIcon from "../icons/InstallIcon";
import { useTranslation } from "react-i18next";
import { LayoutHeader } from "../layout/LayoutHeader";

const Home = () => {
  const { isAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <LoadingState message={t("home.loading_home_page")} />;
  if (error)
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );

  return (
    <>
      <LayoutHeader>
        <h1 className="sm:hidden text-title-blue-gradient via-blue-500 px-4 font-extrabold">
          Fitness Tracker
        </h1>
        <h1 className="hidden sm:block text-title font-bold px-4">
          {t("general.home")}
        </h1>
      </LayoutHeader>
      <div className="card flex flex-col items-center">
        <h1 className="text-title font-bold mb-8 text-center">
          {isAuth ? t("home.welcome_back") : t("home.welcome")}
        </h1>
        <p className="text-body mb-8 text-center">
          {isAuth ? t("home.logged_in") : t("home.please_login_or_register")}
        </p>
        <p className="text-caption mb-6 text-center">
          {t("home.no_purpose_yet")}
        </p>

        {/* Install App Guide Link */}
        <Link to="/installation-guide" className="btn btn-primary">
          <span className="flex items-center gap-2">
            <InstallIcon />
            {t("home.install_app")}
          </span>
        </Link>
      </div>
    </>
  );
};

export default Home;

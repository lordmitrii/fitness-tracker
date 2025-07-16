import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import { Link } from "react-router-dom";
import InstallIcon from "../icons/InstallIcon";
import { useTranslation } from "react-i18next";

const Home = () => {
  const { isAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <LoadingState message={t("home.loading_home_page")} />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="card flex flex-col items-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center">
        {isAuth ? t("home.welcome_back") : t("home.welcome")}
      </h1>
      <p className="text-lg text-gray-700 mb-8 text-center">
        {isAuth ? t("home.logged_in") : t("home.please_login_or_register")}
      </p>
      <p className="text-sm text-gray-500 mb-6 text-center">
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
  );
};

export default Home;

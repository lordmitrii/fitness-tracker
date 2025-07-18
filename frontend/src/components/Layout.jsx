import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GitHubIcon from "../icons/GitHubIcon";
import GlobalLoadingState from "../states/GlobalLoadingState";
import NetworkStatusBanner from "./NetworkStatusBanner";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import { useTranslation } from "react-i18next";

const Layout = ({ children }) => {
  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef(null);
  const { t } = useTranslation();
  const [appLoading, setAppLoading] = useState(() => {
    if (sessionStorage.getItem("hasLoaded") === "1") {
      return false;
    }
    return true;
  });
  

  const navLinks = [
    { to: "/", label: t("general.home"), auth: null },
    {
      to: "/workout-plans",
      label: t("general.workout_plans"),
      auth: true,
    },
    { to: "/exercise-stats", label: t("general.stats"), auth: true },
    { to: "/profile", label: t("general.profile"), auth: true },
    { to: "/login", label: t("general.login"), auth: false },
    { to: "/register", label: t("general.register"), auth: false },
  ];

  useEffect(() => {
    if (!appLoading) return;

    const timeout = setTimeout(() => {
      setAppLoading(false);
      sessionStorage.setItem("hasLoaded", "1");
    }, 1500); // 1.5 seconds delay to simulate loading

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  if (appLoading) {
    return <GlobalLoadingState />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header
        ref={headerRef}
        className="backdrop-blur-xl bg-white shadow-md sticky top-0 z-80"
      >
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link
            to="/"
            className="text-title-blue-gradient tracking-tight font-bold via-blue-500"
          >
            Fitness Tracker
          </Link>

          {/* Hamburger */}
          <button
            className="sm:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition group"
            onClick={() => setIsOpen((open) => !open)}
          >
            <div className="relative w-6 h-6">
              <span
                className={`absolute left-0 top-1/2 w-6 h-0.5 bg-gray-800 rounded transition-all duration-300
                ${isOpen ? "rotate-45 translate-y-0" : "-translate-y-2.5"}
              `}
              />
              <span
                className={`absolute left-0 top-1/2 w-6 h-0.5 bg-gray-800 rounded transition-all duration-300
                ${isOpen ? "opacity-0" : ""}
              `}
              />
              <span
                className={`absolute left-0 top-1/2 w-6 h-0.5 bg-gray-800 rounded transition-all duration-300
                ${isOpen ? "-rotate-45 translate-y-0" : "translate-y-2.5"}
              `}
              />
            </div>
          </button>

          {/* Navigation */}
          <nav
            className={`
              fixed sm:static top-16 left-0 w-full sm:w-auto sm:bg-transparent bg-white backdrop-blur-0 z-70
              shadow-lg sm:shadow-none
              flex-col sm:flex-row flex sm:flex sm:items-center
              gap-2 sm:gap-5
              px-6 py-5 sm:p-0
              rounded-b-2xl sm:rounded-none
              transition-all duration-300
              ${isOpen ? "flex" : "hidden sm:flex"}
            `}
          >
            {navLinks
              .filter((l) => l.auth === null || l.auth === isAuth)
              .map(({ to, label }) =>
                label === t("general.register") ? (
                  <Link
                    key={to}
                    to={to}
                    className="text-center font-semibold bg-gradient-to-r from-blue-500 to-indigo-400 text-white px-4 py-2 rounded-lg shadow hover:scale-105 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    {label}
                  </Link>
                ) : label === t("general.login") ? (
                  <Link
                    key={to}
                    to={to}
                    className={`font-semibold px-3 py-2 rounded-lg ${
                      isActive(to)
                        ? "text-blue-700 bg-blue-100"
                        : "text-gray-700 hover:bg-blue-100"
                    } transition`}
                    onClick={() => setIsOpen(false)}
                  >
                    {label}
                  </Link>
                ) : (
                  <Link
                    key={to}
                    to={to}
                    className={`font-semibold px-3 py-2 rounded-lg ${
                      isActive(to)
                        ? "text-blue-700 bg-blue-100"
                        : "text-gray-700 hover:bg-blue-50"
                    } transition`}
                    onClick={() => setIsOpen(false)}
                  >
                    {label}
                  </Link>
                )
              )}
            {isAuth && (
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="btn btn-danger"
              >
                {t("general.logout")}
              </button>
            )}
          </nav>
        </div>
      </header>

      <div
        id="progress-bar-portal"
        className="sticky top-16 w-full h-2 sm:h-3 z-10"
      />

      <main id="main-container" className="flex-grow min-h-[90dvh]">
        {children}
      </main>

      <NetworkStatusBanner />

      <footer className="bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-inner py-6 mt-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left text-sm font-medium tracking-wide">
            &copy; {new Date().getFullYear()} Fitness Tracker &mdash;{" "}
            {t("layout.all_rights_reserved")}
          </div>
          <div className="flex items-center space-x-4 text-lg">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <a
              href="https://github.com/lordmitrii"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 transition"
            >
              <GitHubIcon />
            </a>
            <a
              href="mailto:dmitrii.lor@glasgow.ac.uk"
              className="hover:text-blue-300 transition text-base"
            >
              {t("general.contact_support")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

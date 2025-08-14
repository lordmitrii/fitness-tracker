import { useTranslation } from "react-i18next";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import NewIcon from "../icons/NewIcon";

const Header = () => {
  const { t } = useTranslation();
  const { isAuth, logout, hasAnyRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef(null);
  const navigate = useNavigate();

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

  const navLinks = [
    { to: "/", label: t("general.home"), auth: null, roles: [] },
    {
      to: "/admin-panel",
      label: t("general.admin_panel"),
      auth: true,
      roles: ["admin"],
    },
    {
      to: "/workout-plans",
      label: t("general.workout_plans"),
      auth: true,
      roles: [],
    },
    {
      to: "/ai-chat",
      label: t("general.ai_chat"),
      auth: true,
      roles: ["admin", "member"],
    },
    { to: "/exercise-stats", label: t("general.stats"), auth: true, roles: [] },
    { to: "/profile", label: t("general.profile"), auth: true, roles: [] },
    { to: "/login", label: t("general.login"), auth: false, roles: [] },
    { to: "/register", label: t("general.register"), auth: false, roles: [] },
  ];

  const linkClasses = (isActive) =>
    `font-semibold px-3 py-2 rounded-lg transition ${
      isActive ? "text-blue-700 bg-blue-100" : `text-gray-700 hover:bg-blue-50`
    }`;

  return (
    <header
      ref={headerRef}
      className="backdrop-blur-xl bg-white shadow-md sticky top-0 z-80 pt-[env(safe-area-inset-top)]"
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center h-[var(--custom-header-size)]">
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
              fixed sm:static top-[calc(env(safe-area-inset-top)+var(--custom-header-size))] left-0 w-full sm:w-auto sm:bg-transparent bg-white backdrop-blur-0 z-70
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
            .filter((l) => !l.roles.length || hasAnyRole(l.roles))
            .map(({ to, label }) =>
              label === t("general.register") ? (
                <NavLink
                  key={to}
                  to={to}
                  className="text-center font-semibold bg-gradient-to-r from-blue-500 to-indigo-400 text-white px-4 py-2 rounded-lg shadow hover:scale-105 transition"
                  onClick={() => setIsOpen(false)}
                >
                  {label}
                </NavLink>
              ) : label === t("general.ai_chat") ? ( //TODO: Remove later
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => linkClasses(isActive)}
                  end={to === "/"}
                >
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">{label}</span>
                    <span className="flex items-center border rounded-xl border-green-400 p-1 text-caption-green italic font-light">
                      <NewIcon size="4" /> {t("general.new")}
                    </span>
                  </div>
                </NavLink>
              ) : (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => linkClasses(isActive)}
                  end={to === "/"}
                >
                  <span className="whitespace-nowrap">{label}</span>
                </NavLink>
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
  );
};

export default Header;

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../LanguageSwitcher";
import ThemeSwitcher from "../ThemeSwitcher";
import { useTranslation, Trans } from "react-i18next";
import { Link } from "react-router-dom";
import GitHubIcon from "../../icons/GitHubIcon";
import { APP_VERSION } from "../../config/versions";

const MoreContent = ({ onDone, variant = "sheet" }) => {
  const { isAuth, hasAnyRole, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const links = [
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
    {
      to: "/register",
      label: t("general.register"),
      auth: false,
      roles: [],
      className:
        "btn text-center text-white text-lg bg-gradient-to-r from-blue-500 to-indigo-400",
    },
  ];

  function handleLogout() {
    logout();
    navigate("/login");
    onDone?.();
  }

  const isSheet = variant === "sheet";

  return (
    <div
      className={`${
        isSheet ? "px-4" : "px-3"
      } flex flex-col justify-between h-full`}
    >
      <div>
        <div className="flex items-center justify-between mt-4 mb-6">
          <h2 className="text-title-blue-gradient font-bold via-blue-500">
            Fitness Tracker
          </h2>
          <div className="text-gray-600 flex justify-center items-center gap-2 mr-1">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>

        <div className={`grid grid-cols-1 space-y-1 mb-2 overflow-hidden`}>
          {links
            .filter((l) => l.auth === null || l.auth === isAuth)
            .filter((l) => !l.roles.length || hasAnyRole(l.roles))
            .map(({ to, label, className }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => onDone?.()}
                end={to === "/"}
                className={({ isActive }) =>
                  className
                    ? className
                    : isSheet
                    ? "btn border-2 w-full text-lg text-gray-600"
                    : [
                        "text-left rounded-xl px-3 py-2",
                        isActive
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-200",
                      ].join(" ")
                }
              >
                {label}
              </NavLink>
            ))}
        </div>

        {isAuth && (
          <button onClick={handleLogout} className="btn btn-danger w-full">
            {t("general.logout")}
          </button>
        )}
      </div>

      <div className="mx-2">
        <div className="flex flex-col justify-center intems-center gap-4 text-gray-600 text- sm:text-left text-sm font-medium tracking-wide mb-8">
          <div className="flex gap-2">
            <span>
              <Trans
                i18nKey="general.our_policies"
                components={[
                  <Link
                    key="privacy-policy-link"
                    to="/privacy-policy"
                    className="underline"
                  />,
                  <Link
                    key="health-data-policy-link"
                    to="/health-data-policy"
                    className="underline"
                  />,
                ]}
              />
            </span>
          </div>

          <div className="flex justify-start items-center gap-2">
            <a
              href="mailto:help.ftrackerapp@mail.com"
              className="hover:text-blue-300 transition text-sm sm:text-base"
            >
              {t("general.contact_support")}
            </a>
            <a
              href="https://github.com/lordmitrii"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 transition"
            >
              <GitHubIcon />
            </a>
          </div>
          <div className="flex justify-start items-center gap-2">
            <span>
              {t("general.version")}: {APP_VERSION}
            </span>
          </div>
        </div>

        {isSheet && (
          <div className="mt-3">
            <button
              className="btn border-2 w-full text-lg text-gray-600"
              onClick={() => onDone?.()}
            >
              {t("general.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoreContent;

import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ProfileNav = () => {
  const { t } = useTranslation();
  const items = [
    { to: "/profile/health", label: t("profile.nav.health") },
    { to: "/profile/stats", label: t("profile.nav.stats") },
  ];
  return (
    <nav className="flex p-4 gap-2">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) =>
            `block text-center btn w-full ${
              isActive ? "btn-primary" : "btn-secondary"
            } whitespace-nowrap`
          }
        >
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default ProfileNav;

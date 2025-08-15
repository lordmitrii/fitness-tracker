import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AdminNav = () => {
  const { t } = useTranslation();
  const items = [
    { to: "/admin-panel/users?footer=false", label: t("admin.nav.users") },
    { to: "/admin-panel/roles?footer=false", label: t("admin.nav.roles") },
    { to: "/admin-panel/audit?footer=false", label: t("admin.nav.audit") },
    { to: "/admin-panel/exercises-and-muscles?footer=false", label: t("admin.nav.exercises_and_muscles") },
    // { to: "/admin-panel/settings", label: t("admin.nav.settings") },
  ];
  return (
    <nav className="p-4 space-y-2">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) =>
            `block text-center btn ${isActive ? "btn-primary" : "btn-secondary"}`
          }
          end
        >
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default AdminNav;

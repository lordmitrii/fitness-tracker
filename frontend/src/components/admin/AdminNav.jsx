import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AdminNav = () => {
  const { t } = useTranslation();
  const items = [
    { to: "/admin-panel/users", label: t("admin.nav.users") },
    { to: "/admin-panel/roles", label: t("admin.nav.roles") },
    { to: "/admin-panel/audit", label: t("admin.nav.audit") },
    {
      to: "/admin-panel/exercises-and-muscles",
      label: t("admin.nav.exercises_and_muscles"),
    },
    // { to: "/admin-panel/settings", label: t("admin.nav.settings") },
  ];
  return (
    <nav className="flex flex-col sm:flex-row p-4 gap-2">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) =>
            `block text-center btn w-full  ${
              isActive ? "btn-primary" : "btn-secondary"
            } whitespace-nowrap`
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

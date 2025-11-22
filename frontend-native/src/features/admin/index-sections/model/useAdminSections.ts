import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface AdminSection {
  title: string;
  route: string;
  icon: string;
  description: string;
}

export function useAdminSections(): AdminSection[] {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        title: t("admin.users") || "Users",
        route: "/(admin)/users",
        icon: "people",
        description: t("admin.manage_users") || "Manage user accounts and permissions",
      },
      {
        title: t("admin.roles") || "Roles",
        route: "/(admin)/roles",
        icon: "admin-panel-settings",
        description: t("admin.manage_roles") || "Manage user roles and permissions",
      },
      {
        title: t("admin.audit") || "Audit Log",
        route: "/(admin)/audit",
        icon: "history",
        description: t("admin.view_audit_log") || "View system audit logs",
      },
      {
        title: t("general.exercises_and_muscles") || "Exercises and Muscles",
        route: "/(admin)/exercises-and-muscles",
        icon: "fitness-center",
        description: t("admin.manage_exercises") || "Manage exercises and muscle groups",
      },
    ],
    [t]
  );
}


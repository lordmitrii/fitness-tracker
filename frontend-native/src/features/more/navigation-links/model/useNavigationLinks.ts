import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/src/shared/lib/context/AuthContext";

interface NavigationLink {
  to: string;
  label: string;
  auth: boolean | null;
  roles: string[];
  isPrimary?: boolean;
  isNew?: boolean;
}

export function useNavigationLinks() {
  const { t } = useTranslation();
  const { isAuth, hasAnyRole } = useAuth();

  const allLinks: NavigationLink[] = useMemo(
    () => [
      { to: "/(tabs)", label: t("general.home"), auth: null, roles: [] },
      {
        to: "/(admin)",
        label: t("general.admin_panel"),
        auth: true,
        roles: ["admin"],
      },
      {
        to: "/(tabs)/workout-plans",
        label: t("general.workout_plans"),
        auth: true,
        roles: [],
      },
      {
        to: "/ai-chat",
        label: t("general.ai_chat"),
        auth: true,
        roles: ["admin", "member"],
        isNew: true,
      },
      { to: "/(tabs)/profile", label: t("general.profile"), auth: true, roles: [] },
      { to: "/settings", label: t("general.settings"), auth: true, roles: [] },
      { to: "/(auth)/login", label: t("general.login"), auth: false, roles: [] },
      {
        to: "/(auth)/register",
        label: t("general.register"),
        auth: false,
        roles: [],
        isPrimary: true,
      },
    ],
    [t]
  );

  const filteredLinks = useMemo(
    () =>
      allLinks
        .filter((l) => l.auth === null || l.auth === isAuth)
        .filter((l) => !l.roles.length || hasAnyRole(l.roles)),
    [allLinks, isAuth, hasAnyRole]
  );

  return { links: filteredLinks };
}


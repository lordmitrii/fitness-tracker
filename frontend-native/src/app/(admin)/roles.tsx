import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/shared/ui/states";

import { RolesList } from "@/src/widgets/admin-roles";
import { useRoles } from "@/src/features/admin/roles";

export default function RolesScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const { roles, loading, error, refreshing, loadRoles, handleRefresh } = useRoles();

  if (loading && roles.length === 0) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("admin.roles") || "Roles",
          })}
        />
        <LoadingState message={t("admin.loading_roles") || "Loading roles..."} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("admin.roles") || "Roles",
          })}
        />
        <ErrorState error={error} onRetry={loadRoles} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("admin.roles") || "Roles",
        })}
      />
      <RolesList
        roles={roles}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </>
  );
}

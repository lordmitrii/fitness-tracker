import { Stack } from "expo-router";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { useRouteGuard } from "@/src/shared/hooks/use-auth/useRouteGuard";

export default function AdminLayout() {
  const { theme } = useTheme();
  const guard = useRouteGuard({
    requireAuth: true,
    requiredRoles: ["admin"],
    restrictedRoles: ["restricted"],
    redirectInsufficientRoleTo: "/(tabs)",
  });

  if (guard.state !== "allowed") {
    return guard.element;
  }

  const headerOptions = createHeaderOptions(theme, {
    headerShown: true,
  });

  return <Stack screenOptions={headerOptions} />;
}

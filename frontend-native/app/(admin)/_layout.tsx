import { Stack } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { useRouteGuard } from "@/src/hooks/auth/useRouteGuard";

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

  return (
    <Stack
      screenOptions={headerOptions}
    />
  );
}

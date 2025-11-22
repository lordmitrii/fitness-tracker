import { Stack } from "expo-router";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { useRouteGuard } from "@/src/shared/hooks/use-auth/useRouteGuard";

export default function AuthLayout() {
  const { theme } = useTheme();
  const guard = useRouteGuard({
    guestOnly: true,
    redirectAuthenticatedTo: "/(tabs)",
  });

  const headerOptions = createHeaderOptions(theme, {
    headerShown: true,
    
  });

  if (guard.state !== "allowed") {
    return guard.element;
  }

  return <Stack screenOptions={headerOptions} />;
}

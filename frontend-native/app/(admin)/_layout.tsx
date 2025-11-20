import { Stack } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { Redirect } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";

export default function AdminLayout() {
  const { isAuth, hasRole } = useAuth();
  const { theme } = useTheme();

  if (!isAuth || !hasRole("admin")) {
    return <Redirect href="/" />;
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

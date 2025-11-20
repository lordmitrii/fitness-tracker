import { Stack } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";

export default function AuthLayout() {
  const { theme } = useTheme();
  
  const headerOptions = createHeaderOptions(theme, {
    headerShown: true,
  });

  return (
    <Stack
      screenOptions={headerOptions}
    />
  );
}


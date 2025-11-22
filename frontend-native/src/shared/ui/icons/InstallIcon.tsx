import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

export default function InstallIcon() {
  const { theme } = useTheme();
  
  return (
    <MaterialIcons
      name="download"
      size={20}
      color={theme.colors.button.primary.text}
    />
  );
}


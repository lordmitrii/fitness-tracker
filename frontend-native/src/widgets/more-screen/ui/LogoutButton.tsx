import { Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface LogoutButtonProps {
  onLogout: () => void;
}

export default function LogoutButton({ onLogout }: LogoutButtonProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <Pressable
      style={[
        styles.logoutButton,
        {
          backgroundColor: theme.colors.status.error.background,
        },
      ]}
      onPress={onLogout}
    >
      <Text
        style={[
          styles.logoutButtonText,
          { color: theme.colors.status.error.text },
        ]}
      >
        {t("general.logout")}
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  logoutButton: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
});


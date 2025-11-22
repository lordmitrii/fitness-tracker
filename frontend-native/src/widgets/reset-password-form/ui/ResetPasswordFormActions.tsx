import { Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface ResetPasswordFormActionsProps {
  onSubmit: () => void;
}

export default function ResetPasswordFormActions({
  onSubmit,
}: ResetPasswordFormActionsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.button.primary.background,
        },
      ]}
      onPress={onSubmit}
    >
      <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
        {t("reset_password.reset_password_button")}
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3.5],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
});


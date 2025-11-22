import { Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface ForgotPasswordFormActionsProps {
  onSubmit: () => void;
  cooldown: number;
  disabled?: boolean;
}

export default function ForgotPasswordFormActions({
  onSubmit,
  cooldown,
  disabled = false,
}: ForgotPasswordFormActionsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor:
            cooldown > 0
              ? theme.colors.button.secondary?.background || theme.colors.card.background
              : theme.colors.button.primary.background,
          opacity: cooldown > 0 ? 0.6 : 1,
          borderWidth: cooldown > 0 ? 1 : 0,
          borderColor: cooldown > 0 ? theme.colors.border : undefined,
        },
      ]}
      onPress={onSubmit}
      disabled={disabled || cooldown > 0}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color:
              cooldown > 0
                ? theme.colors.button.secondary?.text || theme.colors.text.secondary
                : theme.colors.button.primary.text,
          },
        ]}
      >
        {cooldown > 0
          ? `${t("forgot_password.send_reset_link")} (${cooldown})`
          : t("forgot_password.send_reset_link")}
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


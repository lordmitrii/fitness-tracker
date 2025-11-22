import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface LoginFormActionsProps {
  onSubmit: () => void;
  disabled?: boolean;
}

export default function LoginFormActions({
  onSubmit,
  disabled = false,
}: LoginFormActionsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <>
      <Pressable
        style={[
          styles.button,
          styles.primaryButton,
          {
            backgroundColor: theme.colors.button.primary.background,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        onPress={onSubmit}
        disabled={disabled}
      >
        <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
          {t("general.login")}
        </Text>
      </Pressable>

      <View style={styles.registerContainer}>
        <Text style={[styles.registerText, { color: theme.colors.text.secondary }]}>
          {t("login_form.not_registered")}{" "}
        </Text>
        <Pressable onPress={() => router.push("/(auth)/register")}>
          <Text style={[styles.link, { color: theme.colors.button.primary.background }]}>
            {t("general.register")}
          </Text>
        </Pressable>
      </View>
    </>
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
  primaryButton: {},
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing[2],
  },
  registerText: {
    fontSize: theme.fontSize.base,
  },
  link: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});


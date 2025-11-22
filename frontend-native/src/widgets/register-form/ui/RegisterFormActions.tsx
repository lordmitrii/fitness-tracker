import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface RegisterFormActionsProps {
  onSubmit: () => void;
  disabled?: boolean;
}

export default function RegisterFormActions({
  onSubmit,
  disabled = false,
}: RegisterFormActionsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <>
      <Pressable
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.button.primary.background,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        onPress={onSubmit}
        disabled={disabled}
      >
        <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
          {t("general.continue")}
        </Text>
      </Pressable>

      <View style={styles.loginContainer}>
        <Text style={[styles.loginText, { color: theme.colors.text.secondary }]}>
          {t("register_form.already_have_account")}{" "}
        </Text>
        <Pressable onPress={() => router.push("/(auth)/login")}>
          <Text style={[styles.link, { color: theme.colors.button.primary.background }]}>
            {t("general.login")}
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
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing[2],
  },
  loginText: {
    fontSize: theme.fontSize.base,
  },
  link: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});


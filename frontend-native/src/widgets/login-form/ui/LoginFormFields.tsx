import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface LoginFormFieldsProps {
  username: string;
  password: string;
  onUsernameChange: (username: string) => void;
  onPasswordChange: (password: string) => void;
}

export default function LoginFormFields({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
}: LoginFormFieldsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {t("general.username")}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.input?.background || theme.colors.card.background,
              borderColor: theme.colors.border,
              color: theme.colors.text.primary,
            },
          ]}
          value={username}
          onChangeText={onUsernameChange}
          placeholder="user1234"
          placeholderTextColor={theme.colors.text.tertiary}
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.passwordHeader}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>
            {t("general.password")}
          </Text>
          <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
            <Text style={[styles.link, { color: theme.colors.button.primary.background }]}>
              {t("login_form.forgot_password")}
            </Text>
          </Pressable>
        </View>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.input?.background || theme.colors.card.background,
              borderColor: theme.colors.border,
              color: theme.colors.text.primary,
            },
          ]}
          value={password}
          onChangeText={onPasswordChange}
          placeholder={t("login_form.password_placeholder")}
          placeholderTextColor={theme.colors.text.tertiary}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
        />
      </View>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  inputContainer: {
    gap: theme.spacing[2],
  },
  label: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
    fontSize: theme.fontSize.md,
    minHeight: 44,
  },
  link: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});


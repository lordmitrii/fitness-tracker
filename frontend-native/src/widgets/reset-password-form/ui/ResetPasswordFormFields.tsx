import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface ResetPasswordFormFieldsProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
}

export default function ResetPasswordFormFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
}: ResetPasswordFormFieldsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {t("reset_password.new_password_label")}
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
          value={password}
          onChangeText={onPasswordChange}
          placeholder={t("reset_password.new_password_placeholder")}
          placeholderTextColor={theme.colors.text.tertiary}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="newPassword"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {t("reset_password.confirm_password_label")}
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
          value={confirmPassword}
          onChangeText={onConfirmPasswordChange}
          placeholder={t("reset_password.confirm_password_placeholder")}
          placeholderTextColor={theme.colors.text.tertiary}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="newPassword"
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
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
    fontSize: theme.fontSize.md,
    minHeight: 44,
  },
});


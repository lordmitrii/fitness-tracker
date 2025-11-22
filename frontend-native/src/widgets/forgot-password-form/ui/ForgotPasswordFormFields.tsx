import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface ForgotPasswordFormFieldsProps {
  email: string;
  onEmailChange: (email: string) => void;
}

export default function ForgotPasswordFormFields({
  email,
  onEmailChange,
}: ForgotPasswordFormFieldsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        {t("general.email")}
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
        value={email}
        onChangeText={onEmailChange}
        placeholder={t("forgot_password.email_placeholder")}
        placeholderTextColor={theme.colors.text.tertiary}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
    </View>
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


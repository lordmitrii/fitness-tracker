import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface RegisterFormFieldsProps {
  email: string;
  username: string;
  password: string;
  onEmailChange: (email: string) => void;
  onUsernameChange: (username: string) => void;
  onPasswordChange: (password: string) => void;
  errors: Record<string, string>;
}

export default function RegisterFormFields({
  email,
  username,
  password,
  onEmailChange,
  onUsernameChange,
  onPasswordChange,
  errors,
}: RegisterFormFieldsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {t("general.email")}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.input?.background || theme.colors.card.background,
              borderColor: errors.email ? theme.colors.status.error.text : theme.colors.border,
              color: theme.colors.text.primary,
            },
          ]}
          value={email}
          onChangeText={onEmailChange}
          placeholder="username@example.com"
          placeholderTextColor={theme.colors.text.tertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        {errors.email && (
          <Text style={[styles.fieldError, { color: theme.colors.status.error.text }]}>
            {errors.email}
          </Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {t("general.username")}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.input?.background || theme.colors.card.background,
              borderColor: errors.username ? theme.colors.status.error.text : theme.colors.border,
              color: theme.colors.text.primary,
            },
          ]}
          value={username}
          onChangeText={onUsernameChange}
          placeholder="user123"
          placeholderTextColor={theme.colors.text.tertiary}
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
        />
        {errors.username && (
          <Text style={[styles.fieldError, { color: theme.colors.status.error.text }]}>
            {errors.username}
          </Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {t("general.password")}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.input?.background || theme.colors.card.background,
              borderColor: errors.password ? theme.colors.status.error.text : theme.colors.border,
              color: theme.colors.text.primary,
            },
          ]}
          value={password}
          onChangeText={onPasswordChange}
          placeholder={t("register_form.password_placeholder")}
          placeholderTextColor={theme.colors.text.tertiary}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="newPassword"
        />
        {errors.password && (
          <Text style={[styles.fieldError, { color: theme.colors.status.error.text }]}>
            {errors.password}
          </Text>
        )}
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
  fieldError: {
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing[1],
  },
});


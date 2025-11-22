import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface EmailInputFieldProps {
  email: string;
  emailModified: boolean;
  pending: boolean;
  onEmailChange: (email: string) => void;
  onSave: () => void;
}

export default function EmailInputField({
  email,
  emailModified,
  pending,
  onEmailChange,
  onSave,
}: EmailInputFieldProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View style={styles.inputContainer}>
      <View style={styles.emailHeader}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {t("general.email")}
        </Text>
        {emailModified && (
          <Pressable onPress={onSave} disabled={pending}>
            <Text style={[styles.saveButton, { color: theme.colors.button.primary.background }]}>
              {t("general.save")}
            </Text>
          </Pressable>
        )}
      </View>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input?.background || theme.colors.card.background,
            borderColor: theme.colors.border,
            color: theme.colors.text.primary,
            opacity: (!emailModified || pending) ? 0.5 : 1,
          },
        ]}
        editable={!pending}
        value={email}
        onChangeText={onEmailChange}
        placeholder={t("account_verification.email_placeholder")}
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
  emailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  saveButton: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
    fontSize: theme.fontSize.md,
    minHeight: 44,
  },
});


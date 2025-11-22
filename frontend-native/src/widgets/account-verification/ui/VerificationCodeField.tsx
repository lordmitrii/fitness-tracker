import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface VerificationCodeFieldProps {
  code: string;
  onCodeChange: (code: string) => void;
}

export default function VerificationCodeField({
  code,
  onCodeChange,
}: VerificationCodeFieldProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        {t("account_verification.code_label")}
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
        value={code}
        onChangeText={onCodeChange}
        placeholder={t("account_verification.code_placeholder")}
        placeholderTextColor={theme.colors.text.tertiary}
        keyboardType="number-pad"
        autoCapitalize="none"
        autoComplete="off"
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


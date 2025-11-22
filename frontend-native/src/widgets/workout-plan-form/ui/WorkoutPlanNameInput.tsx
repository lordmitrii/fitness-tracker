import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface WorkoutPlanNameInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  maxLength?: number;
  showCharCount?: boolean;
  label?: string;
  placeholder?: string;
}

export default function WorkoutPlanNameInput({
  value,
  onChangeText,
  error,
  maxLength = 50,
  showCharCount = false,
  label,
  placeholder,
}: WorkoutPlanNameInputProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View style={styles.inputContainer}>
      {(label || showCharCount) && (
        <View style={styles.labelRow}>
          {label && (
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              {label}
            </Text>
          )}
          {showCharCount && (
            <Text style={[styles.charCount, { color: theme.colors.text.tertiary }]}>
              {value.length}/{maxLength}
            </Text>
          )}
        </View>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input?.background || theme.colors.card.background,
            borderColor: error ? theme.colors.status.error.text : theme.colors.border,
            color: theme.colors.text.primary,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || t("workout_plans.plan_name_placeholder") || "Enter plan name"}
        placeholderTextColor={theme.colors.text.tertiary}
        maxLength={maxLength}
        autoCapitalize="words"
        autoComplete="off"
      />
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  inputContainer: {
    gap: theme.spacing[2],
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  charCount: {
    fontSize: theme.fontSize.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
    fontSize: theme.fontSize.md,
    minHeight: 44,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing[1],
  },
});


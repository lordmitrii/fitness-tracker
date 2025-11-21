import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { useHapticFeedback } from "@/src/hooks/useHapticFeedback";

const MAX_LENGTH = 50;

interface WorkoutFormProps {
  initialData?: {
    name?: string | null;
  };
  label: string;
  submitLabel: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (payload: { name: string }) => Promise<void> | void;
}

export default function WorkoutForm({
  initialData,
  label,
  submitLabel,
  submitting = false,
  errorMessage,
  onSubmit,
}: WorkoutFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const haptics = useHapticFeedback();
  const [name, setName] = useState(initialData?.name ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialData?.name ?? "");
    setFieldError(null);
  }, [initialData?.name]);

  const validate = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      return t("workout_form.workout_name_required") || "Workout name is required";
    }
    if (trimmed.length > MAX_LENGTH) {
      return (
        t("workout_form.workout_name_too_long", { limit: MAX_LENGTH }) ||
        "Workout name is too long"
      );
    }
    return null;
  }, [name, t]);

  const handleSubmit = useCallback(() => {
    const validation = validate();
    if (validation) {
      setFieldError(validation);
      haptics.triggerError();
      return;
    }
    setFieldError(null);
    haptics.triggerSuccess();
    onSubmit({ name: name.trim() });
  }, [name, onSubmit, validate, haptics]);

  const errorColors = theme.colors.status.error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>{label}</Text>

          {(errorMessage || fieldError) && (
            <View
              style={[
                styles.errorContainer,
                {
                  backgroundColor: errorColors.background,
                  borderColor: errorColors.border,
                },
              ]}
            >
              <Text style={[styles.errorText, { color: errorColors.text }]}>
                {fieldError || errorMessage}
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                {t("workout_form.workout_name_label")}
              </Text>
              <Text style={[styles.charCount, { color: theme.colors.text.secondary }]}>
                {name.length}/{MAX_LENGTH}
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor:
                    theme.colors.input?.background || theme.colors.card.background,
                  borderColor: fieldError ? errorColors.text : theme.colors.border,
                  color: theme.colors.text.primary,
                },
              ]}
              value={name}
              onChangeText={(text) => {
                if (text.length <= MAX_LENGTH) {
                  setName(text);
                }
              }}
              placeholder={t("workout_form.workout_name_placeholder")}
              placeholderTextColor={theme.colors.text.tertiary}
              autoCapitalize="words"
              autoComplete="off"
              returnKeyType="done"
              editable={!submitting}
              onSubmitEditing={handleSubmit}
              maxLength={MAX_LENGTH}
            />
          </View>

          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.button.primary.background,
                opacity: submitting ? 0.6 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
              {submitting ? t("general.loading") || "Loading..." : submitLabel}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
  },
  inputGroup: {
    gap: 12,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  charCount: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

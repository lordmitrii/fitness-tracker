import { useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  BackHandler,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import CheckBox from "@/src/components/CheckBox";
import MuscleGroupSelect from "@/src/components/workout/MuscleGroupSelect";
import type { Identifier } from "@/src/hooks/data/types";

interface LocalizedExercise {
  id: Identifier;
  name?: string | null;
  _label?: string;
}

interface LocalizedMuscleGroup {
  id: Identifier;
  name?: string | null;
  slug?: string | null;
  _label?: string;
}

interface AddExerciseOrMuscleModalProps {
  visible: boolean;
  exercises: LocalizedExercise[];
  muscleGroups: LocalizedMuscleGroup[];
  loading?: boolean;
  onCreateExercise: (payload: {
    name: string;
    muscle_group_id: Identifier;
    auto_translate: boolean;
    is_time_based: boolean;
    is_bodyweight: boolean;
  }) => Promise<void>;
  onCreateMuscleGroup: (payload: {
    name: string;
    auto_translate: boolean;
  }) => Promise<void>;
  onClose: () => void;
  onError?: (error: unknown) => void;
}

type Mode = "exercise" | "muscle";

export default function AddExerciseOrMuscleModal({
  visible,
  exercises,
  muscleGroups,
  loading = false,
  onCreateExercise,
  onCreateMuscleGroup,
  onClose,
  onError,
}: AddExerciseOrMuscleModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [mode, setMode] = useState<Mode>("exercise");
  const [name, setName] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [isBodyweight, setIsBodyweight] = useState(false);
  const [isTimeBased, setIsTimeBased] = useState(false);
  const [muscleGroupID, setMuscleGroupID] = useState<Identifier | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName("");
    setAutoTranslate(true);
    setIsBodyweight(false);
    setIsTimeBased(false);
    setMuscleGroupID(null);
    setErrors({});
    setMode("exercise");
  };

  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      resetForm();
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  const validate = useCallback(() => {
    const nextErrors: Record<string, string> = {};
    const trimmed = name.trim();
    if (!trimmed) {
      nextErrors.name = t("admin.exercises.name_required");
    } else if (trimmed.length > 50) {
      nextErrors.name =
        t("general.name_too_long", { limit: 50 }) ||
        "Name must be 50 characters or less";
    }

    if (mode === "exercise") {
      if (!muscleGroupID) {
        nextErrors.muscleGroupID =
          t("admin.exercises.muscle_group_required") ||
          "Muscle group is required";
      }
      const duplicate = exercises.find(
        (ex) =>
          (ex._label || ex.name || "")
            .trim()
            .toLowerCase() === trimmed.toLowerCase()
      );
      if (!nextErrors.name && duplicate) {
        nextErrors.name =
          t("admin.exercises.exercise_already_exists") ||
          "Exercise already exists";
      }
    } else {
      const duplicateGroup = muscleGroups.find(
        (group) =>
          (group._label || group.name || "")
            .trim()
            .toLowerCase() === trimmed.toLowerCase()
      );
      if (!nextErrors.name && duplicateGroup) {
        nextErrors.name =
          t("admin.exercises.muscle_group_already_exists") ||
          "Muscle group already exists";
      }
    }
    return nextErrors;
  }, [mode, name, muscleGroupID, exercises, muscleGroups, t]);

  const handleSubmit = useCallback(async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    const trimmed = name.trim();
    setSubmitting(true);
    try {
      if (mode === "exercise" && muscleGroupID) {
        await onCreateExercise({
          name: trimmed,
          muscle_group_id: muscleGroupID,
          auto_translate: autoTranslate,
          is_bodyweight: isBodyweight,
          is_time_based: isTimeBased,
        });
      } else if (mode === "muscle") {
        await onCreateMuscleGroup({
          name: trimmed,
          auto_translate: autoTranslate,
        });
      }
      resetForm();
      onClose();
    } catch (err) {
      console.error("Failed to create exercise/muscle group", err);
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  }, [
    validate,
    name,
    mode,
    muscleGroupID,
    autoTranslate,
    isBodyweight,
    isTimeBased,
    onCreateExercise,
    onCreateMuscleGroup,
    onClose,
    onError,
  ]);

  const submittingNow = submitting || loading;
  const title =
    mode === "exercise"
      ? `${t("general.add")} ${t("admin.exercises.exercise")}`
      : `${t("general.add")} ${t("admin.exercises.muscle_group")}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        resetForm();
        onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {submittingNow && (
            <View
              style={[
                styles.loadingOverlay,
                { backgroundColor: theme.colors.background + "AA" },
              ]}
            >
              <ActivityIndicator
                size="large"
                color={theme.colors.button.primary.background}
              />
            </View>
          )}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {title}
            </Text>

            <View style={styles.modeSwitch}>
              <Pressable
                style={[
                  styles.modeButton,
                  {
                    backgroundColor:
                      mode === "exercise"
                        ? theme.colors.button.primary.background
                        : theme.colors.card.background,
                    borderColor:
                      mode === "exercise"
                        ? theme.colors.button.primary.background
                        : theme.colors.border,
                  },
                ]}
                onPress={() => {
                  setMode("exercise");
                  setErrors({});
                }}
              >
                <Text
                  style={[
                    styles.modeLabel,
                    {
                      color:
                        mode === "exercise"
                          ? theme.colors.button.primary.text
                          : theme.colors.text.primary,
                    },
                  ]}
                >
                  {t("admin.exercises.exercise")}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modeButton,
                  {
                    backgroundColor:
                      mode === "muscle"
                        ? theme.colors.button.primary.background
                        : theme.colors.card.background,
                    borderColor:
                      mode === "muscle"
                        ? theme.colors.button.primary.background
                        : theme.colors.border,
                  },
                ]}
                onPress={() => {
                  setMode("muscle");
                  setErrors({});
                }}
              >
                <Text
                  style={[
                    styles.modeLabel,
                    {
                      color:
                        mode === "muscle"
                          ? theme.colors.button.primary.text
                          : theme.colors.text.primary,
                    },
                  ]}
                >
                  {t("admin.exercises.muscle_group")}
                </Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.name
                      ? theme.colors.status.error.text
                      : theme.colors.border,
                    backgroundColor:
                      theme.colors.input?.background || theme.colors.background,
                    color: theme.colors.text.primary,
                  },
                ]}
                placeholder={
                  mode === "exercise"
                    ? t("admin.exercises.exercise_name_placeholder")
                    : t("admin.exercises.muscle_group_name_placeholder")
                }
                placeholderTextColor={theme.colors.text.tertiary}
                value={name}
                onChangeText={(text) => {
                  if (/^[\p{L}\s\-]*$/u.test(text)) {
                    setName(text);
                  }
                }}
                autoCapitalize="words"
                maxLength={50}
                editable={!submittingNow}
              />
              {errors.name && (
                <Text
                  style={[
                    styles.errorText,
                    { color: theme.colors.status.error.text },
                  ]}
                >
                  {errors.name}
                </Text>
              )}
            </View>

            {mode === "exercise" && (
              <>
                <View style={styles.field}>
                  <MuscleGroupSelect
                    muscleGroups={muscleGroups}
                    value={muscleGroupID}
                    onChange={(value) => setMuscleGroupID(value)}
                    required
                  />
                  {errors.muscleGroupID && (
                    <Text
                      style={[
                        styles.errorText,
                        { color: theme.colors.status.error.text },
                      ]}
                    >
                      {errors.muscleGroupID}
                    </Text>
                  )}
                </View>
                <View style={styles.checkboxRow}>
                  <View style={styles.checkboxItem}>
                    <CheckBox
                      checked={isBodyweight}
                      onChange={setIsBodyweight}
                      disabled={submittingNow}
                    />
                    <Text
                      style={{ color: theme.colors.text.secondary, marginLeft: 8 }}
                    >
                      {t("admin.exercises.is_bodyweight")}
                    </Text>
                  </View>
                  <View style={styles.checkboxItem}>
                    <CheckBox
                      checked={isTimeBased}
                      onChange={setIsTimeBased}
                      disabled={submittingNow}
                    />
                    <Text
                      style={{ color: theme.colors.text.secondary, marginLeft: 8 }}
                    >
                      {t("admin.exercises.is_time_based")}
                    </Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.checkboxItem}>
              <CheckBox
                checked={autoTranslate}
                onChange={setAutoTranslate}
                disabled={submittingNow}
              />
              <Text
                style={{ color: theme.colors.text.secondary, marginLeft: 8 }}
              >
                {t("admin.exercises.auto_translate")}
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.card.background,
                  },
                ]}
                onPress={() => {
                  resetForm();
                  onClose();
                }}
                disabled={submittingNow}
              >
                <Text style={{ color: theme.colors.text.primary }}>
                  {t("general.cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.colors.button.primary.background,
                    opacity: submittingNow ? 0.7 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={submittingNow}
              >
                <Text style={{ color: theme.colors.button.primary.text }}>
                  {submittingNow
                    ? t("general.loading")
                    : t("general.add")}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: "90%",
    paddingBottom: 24,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  modeSwitch: {
    flexDirection: "row",
    gap: 12,
  },
  modeButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  modeLabel: {
    fontWeight: "600",
  },
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});


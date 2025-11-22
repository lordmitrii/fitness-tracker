import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Switch,
  BackHandler,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useExercisesData } from "@/src/entities/exercise";
import { ExerciseSelect } from "./exercise-select";
import { MuscleGroupSelect } from "@/src/shared/ui/muscle-group-select";
import { useCooldown } from "@/src/shared/hooks/interaction"; // optional for future use

type Identifier = string | number;

interface AddWorkoutExerciseModalProps {
  visible: boolean;
  planID: Identifier;
  cycleID: Identifier;
  workoutID: Identifier;
  replaceExerciseID?: Identifier;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddWorkoutExerciseModal({
  visible,
  planID,
  cycleID,
  workoutID,
  replaceExerciseID,
  onClose,
  onSuccess,
}: AddWorkoutExerciseModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { exercises, muscleGroups, loading, mutations } = useExercisesData();
  const [muscleGroupID, setMuscleGroupID] = useState<Identifier | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<{ id: Identifier; source?: string } | null>(null);
  const [makingCustomExercise, setMakingCustomExercise] = useState(false);
  const [name, setName] = useState("");
  const [isBodyweight, setIsBodyweight] = useState(false);
  const [isTimeBased, setIsTimeBased] = useState(false);
  const [sets, setSets] = useState("3");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setMuscleGroupID(null);
      setSelectedExercise(null);
      setMakingCustomExercise(false);
      setName("");
      setIsBodyweight(false);
      setIsTimeBased(false);
      setSets("3");
      setErrors({});
      setSubmitting(false);
    }
  }, [visible]);

  const exercisesWithTranslations = useMemo(() => {
    return exercises.map((exercise) => {
      let label = "";
      if (exercise.slug) {
        const translated = t(`exercise.${exercise.slug}`);
        if (translated && translated !== `exercise.${exercise.slug}`) {
          label = translated;
        }
      }
      if (!label) {
        label = exercise.name || t("general.n_a");
      }
      if (exercise.source === "custom") {
        label = `${label} ${t("add_workout_exercise_modal.custom_suffix")}`;
      }
      return {
        ...exercise,
        _label: label,
      };
    });
  }, [exercises, t]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!makingCustomExercise && !selectedExercise) {
      nextErrors.exercise = t("add_workout_exercise_modal.exercise_required");
    }
    if (makingCustomExercise) {
      const trimmed = name.trim();
      if (!trimmed) {
        nextErrors.name = t("add_workout_exercise_modal.name_required");
      } else if (trimmed.length > 50) {
        nextErrors.name = t("general.name_too_long", { limit: 50 });
      }
      if (!muscleGroupID) {
        nextErrors.muscleGroupID = t("add_workout_exercise_modal.muscle_group_required");
      }
    }
    const setsNum = Number.parseInt(sets, 10);
    if (!Number.isInteger(setsNum) || setsNum <= 0) {
      nextErrors.sets = t("add_workout_exercise_modal.sets_required");
    } else if (setsNum > 20) {
      nextErrors.sets = t("add_workout_exercise_modal.sets_limit_exceeded", { limit: 20 });
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      let individualExerciseId: Identifier | undefined;
      if (makingCustomExercise) {
        const response = await mutations.createIndividualExercise.mutateAsync({
          name: name.trim(),
          muscle_group_id: muscleGroupID || undefined,
          is_bodyweight: isBodyweight,
          is_time_based: isTimeBased,
        });
        individualExerciseId = response.id;
      } else if (selectedExercise) {
        if (selectedExercise.source === "pool") {
          const response = await mutations.createIndividualExercise.mutateAsync({
            exercise_id: selectedExercise.id,
          });
          individualExerciseId = response.id;
        } else {
          individualExerciseId = selectedExercise.id;
        }
      }

      if (!individualExerciseId) {
        throw new Error("Unable to determine exercise to attach.");
      }

      await mutations.attachWorkoutExercise.mutateAsync({
        planID,
        cycleID,
        workoutID,
        replaceExerciseID,
        individual_exercise_id: individualExerciseId,
        sets_qt: Number(sets),
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to add exercise:", err);
      setErrors((prev) => ({
        ...prev,
        submit: err instanceof Error ? err.message : String(err),
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
              {t("add_workout_exercise_modal.title")}
            </Text>
            <Pressable onPress={onClose}>
              <MaterialIcons name="close" size={24} color={theme.colors.text.secondary} />
            </Pressable>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.button.primary.background} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.formContent}>
              <MuscleGroupSelect
                muscleGroups={muscleGroups}
                value={muscleGroupID}
                onChange={setMuscleGroupID}
                required={makingCustomExercise}
              />
              {errors.muscleGroupID && (
                <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
                  {errors.muscleGroupID}
                </Text>
              )}
              {!makingCustomExercise && (
                <>
                  <ExerciseSelect
                    exercises={exercisesWithTranslations}
                    muscleGroupID={muscleGroupID}
                    value={selectedExercise}
                    onChange={setSelectedExercise}
                  />
                  {errors.exercise && (
                    <Text
                      style={[styles.errorText, { color: theme.colors.status.error.text }]}
                    >
                      {errors.exercise}
                    </Text>
                  )}
                </>
              )}
              <Pressable
                style={styles.toggleRow}
                onPress={() => setMakingCustomExercise((prev) => !prev)}
              >
                <Text style={{ color: theme.colors.text.primary, fontWeight: "600" }}>
                  {t("add_workout_exercise_modal.create_custom_exercise")}
                </Text>
                <Switch value={makingCustomExercise} onValueChange={setMakingCustomExercise} />
              </Pressable>
              {makingCustomExercise && (
                <View style={styles.customFields}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                    {t("add_workout_exercise_modal.exercise_name_placeholder")}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        borderColor: errors.name ? theme.colors.status.error.text : theme.colors.border,
                        backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                        color: theme.colors.text.primary,
                      },
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder={t("add_workout_exercise_modal.exercise_name_placeholder")}
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                  {errors.name && (
                    <Text
                      style={[styles.errorText, { color: theme.colors.status.error.text }]}
                    >
                      {errors.name}
                    </Text>
                  )}
                  <View style={styles.switchRow}>
                    <View style={styles.switchOption}>
                      <Text style={{ color: theme.colors.text.primary }}>
                        {t("add_workout_exercise_modal.is_bodyweight")}
                      </Text>
                      <Switch value={isBodyweight} onValueChange={setIsBodyweight} />
                    </View>
                    <View style={styles.switchOption}>
                      <Text style={{ color: theme.colors.text.primary }}>
                        {t("add_workout_exercise_modal.is_time_based")}
                      </Text>
                      <Switch value={isTimeBased} onValueChange={setIsTimeBased} />
                    </View>
                  </View>
                </View>
              )}
              <View style={styles.setsField}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                  {t("measurements.sets")}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      borderColor: errors.sets ? theme.colors.status.error.text : theme.colors.border,
                      backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="numeric"
                />
                {errors.sets && (
                  <Text
                    style={[styles.errorText, { color: theme.colors.status.error.text }]}
                  >
                    {errors.sets}
                  </Text>
                )}
              </View>
              {errors.submit && (
                <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
                  {errors.submit}
                </Text>
              )}
            </ScrollView>
          )}
          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: theme.colors.button.primary.background,
                opacity: submitting ? 0.6 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={theme.colors.button.primary.text} />
            ) : (
              <Text style={[styles.submitButtonText, { color: theme.colors.button.primary.text }]}>
                {replaceExerciseID
                  ? t("general.replace_exercise")
                  : t("add_workout_exercise_modal.add_exercise_button")}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingBottom: 16,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  customFields: {
    gap: 12,
  },
  label: {
    fontSize: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  switchOption: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setsField: {
    gap: 8,
  },
  submitButton: {
    marginTop: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});


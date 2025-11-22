import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  FlatList,
  Modal,
} from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

type ExerciseOption = {
  id: string | number;
  name?: string | null;
  slug?: string | null;
  source?: string;
  muscle_group_id?: string | number | null;
  is_bodyweight?: boolean;
  is_time_based?: boolean;
};

interface ExerciseSelectProps {
  exercises: ExerciseOption[];
  muscleGroupID: string | number | null;
  value: { id: string | number; source?: string } | null;
  onChange: (value: { id: string | number; source?: string } | null) => void;
  disabled?: boolean;
}

export default function ExerciseSelect({
  exercises,
  muscleGroupID,
  value,
  onChange,
  disabled = false,
}: ExerciseSelectProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const exercisesWithLabels = useMemo(() => {
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
        _labelLower: label.toLowerCase(),
      };
    });
  }, [exercises, t]);

  const filteredByMuscle = useMemo(() => {
    if (muscleGroupID == null) return exercisesWithLabels;
    return exercisesWithLabels.filter(
      (exercise) => String(exercise.muscle_group_id) === String(muscleGroupID)
    );
  }, [exercisesWithLabels, muscleGroupID]);

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    const exercise = exercisesWithLabels.find(
      (item) => String(item.id) === String(value.id) && item.source === value.source
    );
    return exercise?._label || "";
  }, [value, exercisesWithLabels]);

  const filteredExercises = useMemo(() => {
    const lower = search.trim().toLowerCase();
    if (!lower) return filteredByMuscle;
    return filteredByMuscle.filter((exercise) =>
      exercise._labelLower?.includes(lower)
    );
  }, [filteredByMuscle, search]);

  const handleSelect = (exercise: ExerciseOption | null) => {
    setOpen(false);
    if (!exercise) {
      onChange(null);
    } else {
      onChange({ id: exercise.id, source: exercise.source });
    }
  };

  return (
    <>
      <Pressable
        style={[
          styles.field,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.input?.background || theme.colors.card.background,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <View>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
            {t("add_workout_exercise_modal.exercise_label")}
          </Text>
          <Text style={[styles.value, { color: theme.colors.text.primary }]}>
            {selectedLabel || t("add_workout_exercise_modal.select_exercise")}
          </Text>
        </View>
        <MaterialIcons
          name="arrow-drop-down"
          size={24}
          color={theme.colors.text.secondary}
        />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
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
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>{t("add_workout_exercise_modal.select_exercise")}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.colors.text.secondary}
                />
              </Pressable>
            </View>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.colors.input?.background || theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                },
              ]}
              value={search}
              onChangeText={setSearch}
              placeholder={t("add_workout_exercise_modal.search_exercises")}
              placeholderTextColor={theme.colors.text.tertiary}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => `${item.source ?? "pool"}-${item.id}`}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.optionRow}>
                    <Text style={{ color: theme.colors.text.primary, fontWeight: "500" }}>
                      {item._label}
                    </Text>
                    {item.is_bodyweight && (
                      <Text style={{ color: theme.colors.text.tertiary, fontSize: 12 }}>
                        {t("workout_plan_single.bodyweight_exercise")}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}
              style={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={{ color: theme.colors.text.secondary }}>
                    {t("add_workout_exercise_modal.no_exercises_found")}
                  </Text>
                </View>
              }
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  optionRow: {
    gap: 4,
  },
  list: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: "center",
    padding: 16,
  },
});



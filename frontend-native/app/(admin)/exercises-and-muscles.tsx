import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { useTheme } from "@/src/context/ThemeContext";
import { LoadingState, ErrorState } from "@/src/states";
import PullToRefresh from "@/src/components/common/PullToRefresh";
import useExercisesData from "@/src/hooks/data/useExercisesData";
import AddExerciseOrMuscleModal from "@/src/modals/admin/AddExerciseOrMuscleModal";

type FilterValue = string | number | "all";

export default function AdminExercisesAndMusclesScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<FilterValue>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [exerciseEditMode, setExerciseEditMode] = useState(false);
  const [muscleEditMode, setMuscleEditMode] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    poolOnlyExercises = [],
    muscleGroups = [],
    loading,
    error,
    refetch,
    mutations,
  } = useExercisesData();

  const localizedExercises = useMemo(() => {
    return poolOnlyExercises.map((exercise) => {
      let label = exercise.name || t("general.n_a");
      if (exercise.slug) {
        const translated = t(`exercise.${exercise.slug}`);
        if (translated && translated !== `exercise.${exercise.slug}`) {
          label = translated;
        }
      }
      return {
        ...exercise,
        _label: label,
        _labelLower: label.toLowerCase(),
      };
    });
  }, [poolOnlyExercises, t]);

  const localizedMuscles = useMemo(() => {
    return muscleGroups.map((group) => {
      let label = group.name || t("general.n_a");
      if (group.slug) {
        const translated = t(`muscle_group.${group.slug}`);
        if (translated && translated !== `muscle_group.${group.slug}`) {
          label = translated;
        }
      }
      return {
        ...group,
        _label: label,
        _labelLower: label.toLowerCase(),
      };
    });
  }, [muscleGroups, t]);

  const filteredExercises = useMemo(() => {
    const term = query.trim().toLowerCase();
    return localizedExercises.filter((exercise) => {
      const matchesQuery = !term || exercise._labelLower.includes(term);
      const matchesMuscle =
        muscleFilter === "all" ||
        String(exercise.muscle_group_id ?? "") === String(muscleFilter);
      return matchesQuery && matchesMuscle;
    });
  }, [localizedExercises, query, muscleFilter]);

  const exerciseCountByMuscle = useMemo(() => {
    const counts = new Map<string, number>();
    poolOnlyExercises.forEach((exercise) => {
      const key = String(exercise.muscle_group_id ?? "");
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [poolOnlyExercises]);

  const clearFilters = () => {
    setQuery("");
    setMuscleFilter("all");
  };

  const handleDeleteExercise = (exerciseID: string | number) => {
    Alert.alert(
      t("general.delete"),
      t("admin.exercises.confirm_delete_exercise") ||
        "Delete this exercise?",
      [
        { text: t("general.cancel"), style: "cancel" },
        {
          text: t("general.delete"),
          style: "destructive",
          onPress: () => mutations.deleteExercise.mutate(exerciseID),
        },
      ]
    );
  };

  const handleDeleteMuscle = (muscleID: string | number) => {
    Alert.alert(
      t("general.delete"),
      t("admin.exercises.confirm_delete_muscle_group") ||
        "Delete this muscle group?",
      [
        { text: t("general.cancel"), style: "cancel" },
        {
          text: t("general.delete"),
          style: "destructive",
          onPress: () => mutations.deleteMuscleGroup.mutate(muscleID),
        },
      ]
    );
  };

  const handleCreateExercise = useCallback(
    async (payload: {
      name: string;
      muscle_group_id: string | number;
      auto_translate: boolean;
      is_time_based: boolean;
      is_bodyweight: boolean;
    }) => {
      setActionError(null);
      try {
        await mutations.createExercise.mutateAsync(payload);
      } catch (err) {
        setActionError(
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || (err instanceof Error ? err.message : String(err))
        );
        throw err;
      }
    },
    [mutations.createExercise]
  );

  const handleCreateMuscleGroup = useCallback(
    async (payload: { name: string; auto_translate: boolean }) => {
      setActionError(null);
      try {
        await mutations.createMuscleGroup.mutateAsync(payload);
      } catch (err) {
        setActionError(
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || (err instanceof Error ? err.message : String(err))
        );
        throw err;
      }
    },
    [mutations.createMuscleGroup]
  );

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("general.exercises_and_muscles") || "Exercises and Muscles",
          })}
        />
        <LoadingState message={t("general.loading")} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("general.exercises_and_muscles") || "Exercises and Muscles",
          })}
        />
        <ErrorState error={error} onRetry={refetch} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.exercises_and_muscles") || "Exercises and Muscles",
        })}
      />
      <PullToRefresh onRefresh={() => refetch().then(() => {})}>
        <ScrollView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {t("admin.exercises.title")}
            </Text>
            <Pressable
              style={[
                styles.primaryButton,
                { backgroundColor: theme.colors.button.primary.background },
              ]}
              onPress={() => setModalVisible(true)}
            >
              <MaterialIcons
                name="add"
                size={20}
                color={theme.colors.button.primary.text}
              />
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: theme.colors.button.primary.text },
                ]}
              >
                {t("admin.exercises.add_exercise")}
              </Text>
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  backgroundColor:
                    theme.colors.input?.background || theme.colors.card.background,
                  color: theme.colors.text.primary,
                },
              ]}
              value={query}
              onChangeText={setQuery}
              placeholder={t("admin.exercises.search_placeholder")}
              placeholderTextColor={theme.colors.text.tertiary}
            />
            <Pressable
              style={[
                styles.secondaryButton,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.card.background,
                  opacity: !query && muscleFilter === "all" ? 0.5 : 1,
                },
              ]}
              onPress={clearFilters}
              disabled={!query && muscleFilter === "all"}
            >
              <Text style={{ color: theme.colors.text.primary }}>
                {t("general.clear")}
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: theme.colors.card.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {t("admin.exercises.exercise_list")}
              </Text>
              <Pressable
                onPress={() => setExerciseEditMode((prev) => !prev)}
                style={styles.iconButton}
              >
                <MaterialIcons
                  name={exerciseEditMode ? "check" : "edit"}
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </Pressable>
            </View>

            {filteredExercises.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                {t("admin.no_exercises")}
              </Text>
            ) : (
              filteredExercises.map((exercise) => (
                <View
                  key={exercise.id}
                  style={[
                    styles.exerciseRow,
                    { borderColor: theme.colors.border },
                  ]}
                >
                  <View style={styles.exerciseInfo}>
                    <Text
                      style={[styles.exerciseName, { color: theme.colors.text.primary }]}
                      numberOfLines={1}
                    >
                      {exercise._label}
                    </Text>
                    <Text
                      style={[styles.exerciseMeta, { color: theme.colors.text.secondary }]}
                    >
                      {exercise.is_time_based
                        ? t("admin.exercises.is_time_based")
                        : t("admin.exercises.not_time_based")}
                      {" • "}
                      {exercise.is_bodyweight
                        ? t("admin.exercises.is_bodyweight")
                        : t("admin.exercises.not_bodyweight")}
                    </Text>
                  </View>
                  {exerciseEditMode && (
                    <Pressable
                      onPress={() => handleDeleteExercise(exercise.id)}
                      style={styles.iconButton}
                    >
                      <MaterialIcons
                        name="delete"
                        size={20}
                        color={theme.colors.status.error.text}
                      />
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </View>

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: theme.colors.card.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {t("admin.exercises.muscles_title")}
              </Text>
              <Pressable
                onPress={() => setMuscleEditMode((prev) => !prev)}
                style={styles.iconButton}
              >
                <MaterialIcons
                  name={muscleEditMode ? "check" : "edit"}
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </Pressable>
            </View>
            <Text style={[styles.sectionHint, { color: theme.colors.text.secondary }]}>
              {t("admin.exercises.muscles_hint")}
            </Text>

            {localizedMuscles
              .slice()
              .sort((a, b) => a._labelLower.localeCompare(b._labelLower))
              .map((muscle) => {
                const count =
                  exerciseCountByMuscle.get(String(muscle.id)) || 0;
                const active =
                  muscleFilter !== "all" &&
                  String(muscleFilter) === String(muscle.id);
                return (
                  <Pressable
                    key={muscle.id}
                    style={[
                      styles.muscleRow,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: active
                          ? theme.colors.button.secondary?.background ||
                            theme.colors.card.background
                          : theme.colors.card.background,
                      },
                    ]}
                    onPress={() =>
                      setMuscleFilter(active ? "all" : (muscle.id as FilterValue))
                    }
                  >
                    <Text
                      style={[
                        styles.muscleName,
                        { color: theme.colors.text.primary },
                      ]}
                    >
                      {muscle._label}
                    </Text>
                    {muscleEditMode ? (
                      <Pressable
                        onPress={() => handleDeleteMuscle(muscle.id)}
                        style={styles.iconButton}
                      >
                        <MaterialIcons
                          name="delete"
                          size={20}
                          color={theme.colors.status.error.text}
                        />
                      </Pressable>
                    ) : (
                      <View
                        style={[
                          styles.countBadge,
                          {
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.background,
                          },
                        ]}
                      >
                        <Text
                          style={{ color: theme.colors.text.primary, fontWeight: "600" }}
                        >
                          {count}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
          </View>

          {actionError && (
            <Text
              style={[
                styles.errorMessage,
                { color: theme.colors.status.error.text },
              ]}
            >
              {actionError}
            </Text>
          )}
        </ScrollView>
      </PullToRefresh>

      <AddExerciseOrMuscleModal
        visible={modalVisible}
        exercises={localizedExercises}
        muscleGroups={localizedMuscles}
        loading={loading}
        onCreateExercise={handleCreateExercise}
        onCreateMuscleGroup={handleCreateMuscleGroup}
        onClose={() => {
          setModalVisible(false);
          setActionError(null);
        }}
        onError={(err) =>
          setActionError(
            (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || (err instanceof Error ? err.message : String(err))
          )
        }
      />
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing[4],
    gap: theme.spacing[4],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: "700",
    flex: 1,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1.5],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2.5],
    borderRadius: theme.borderRadius.xl,
  },
  primaryButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  searchRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing[3.5],
    paddingVertical: theme.spacing[2.5],
    fontSize: theme.fontSize.md,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing[4],
    justifyContent: "center",
    alignItems: "center",
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[4],
    gap: theme.spacing[3],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
  },
  sectionHint: {
    fontSize: theme.fontSize['sm-md'],
  },
  iconButton: {
    padding: theme.spacing[1],
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingVertical: theme.spacing[2.5],
    gap: theme.spacing[3],
  },
  exerciseInfo: {
    flex: 1,
    gap: theme.spacing[1],
  },
  exerciseName: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
  exerciseMeta: {
    fontSize: theme.fontSize.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    textAlign: "center",
  },
  muscleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingVertical: theme.spacing[2.5],
    paddingHorizontal: theme.spacing[1],
    borderRadius: theme.borderRadius.lg,
  },
  muscleName: {
    fontSize: theme.fontSize['md-sm'],
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: theme.spacing[2.5],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
  },
  errorMessage: {
    fontSize: theme.fontSize['sm-md'],
    textAlign: "center",
  },
});

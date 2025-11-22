import { useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { LoadingState, ErrorState } from "@/src/shared/ui/states";
import { useHapticFeedback } from "@/src/shared/hooks/interaction";
import { useExercisesData } from "@/src/entities/exercise";
import AddExerciseOrMuscleModal from "@/src/features/admin/add-exercise-or-muscle/ui/AddExerciseOrMuscleModal";

import {
  ExerciseFilters,
  ExerciseList,
  MuscleGroupList,
} from "@/src/widgets/admin-exercises";
import {
  useExerciseManagement,
  useFilterExercises,
  useLocalizeExercises,
  useExerciseCounts,
} from "@/src/features/admin/exercise-management";
import {
  useMuscleManagement,
  useLocalizeMuscles,
} from "@/src/features/admin/muscle-management";

type FilterValue = string | number | "all";

export default function AdminExercisesAndMusclesScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const haptics = useHapticFeedback();
  const styles = createStyles(theme);

  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<FilterValue>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [exerciseEditMode, setExerciseEditMode] = useState(false);
  const [muscleEditMode, setMuscleEditMode] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    poolOnlyExercises = [],
    muscleGroups = [],
    loading,
    error,
    refetch,
    mutations,
  } = useExercisesData();

  const { localizedExercises } = useLocalizeExercises(poolOnlyExercises);
  const { localizedMuscles } = useLocalizeMuscles(muscleGroups);
  const { filteredExercises } = useFilterExercises({
    exercises: localizedExercises,
    query,
    muscleFilter,
  });
  const { exerciseCountByMuscle } = useExerciseCounts(poolOnlyExercises);

  const { deleteExercise, createExercise } = useExerciseManagement({
    deleteExerciseMutation: mutations.deleteExercise.mutate,
    createExerciseMutation: mutations.createExercise.mutateAsync,
  });

  const { deleteMuscle, createMuscleGroup } = useMuscleManagement({
    deleteMuscleGroupMutation: mutations.deleteMuscleGroup.mutate,
    createMuscleGroupMutation: mutations.createMuscleGroup.mutateAsync,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.triggerLight();
    try {
      await refetch();
      haptics.triggerSuccess();
    } catch (error) {
      haptics.triggerError();
      console.error("Error refreshing exercises/muscles:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, haptics]);

  const clearFilters = () => {
    setQuery("");
    setMuscleFilter("all");
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
      const result = await createExercise(payload);
      if (result.error) {
        setActionError(result.error);
        throw new Error(result.error);
      }
    },
    [createExercise]
  );

  const handleCreateMuscleGroup = useCallback(
    async (payload: { name: string; auto_translate: boolean }) => {
      setActionError(null);
      const result = await createMuscleGroup(payload);
      if (result.error) {
        setActionError(result.error);
        throw new Error(result.error);
      }
    },
    [createMuscleGroup]
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
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.button.primary.background}
            colors={[theme.colors.button.primary.background]}
            progressBackgroundColor={theme.colors.background}
          />
        }
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

        <ExerciseFilters
          query={query}
          onQueryChange={setQuery}
          muscleFilter={muscleFilter}
          onClearFilters={clearFilters}
        />

        <ExerciseList
          exercises={filteredExercises}
          editMode={exerciseEditMode}
          onToggleEditMode={() => setExerciseEditMode((prev) => !prev)}
          onDeleteExercise={deleteExercise}
        />

        <MuscleGroupList
          muscleGroups={localizedMuscles}
          editMode={muscleEditMode}
          muscleFilter={muscleFilter}
          exerciseCountByMuscle={exerciseCountByMuscle}
          onToggleEditMode={() => setMuscleEditMode((prev) => !prev)}
          onFilterChange={setMuscleFilter}
          onDeleteMuscle={deleteMuscle}
        />

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
  errorMessage: {
    fontSize: theme.fontSize['sm-md'],
    textAlign: "center",
  },
});

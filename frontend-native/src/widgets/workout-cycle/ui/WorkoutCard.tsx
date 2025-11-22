import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { WorkoutExerciseList } from "./exercise-list";

interface WorkoutCardProps {
  workout: any;
  unitSystem: "metric" | "imperial";
  planID: string | number;
  cycleID: string | number;
  onPress: (workoutId: string | number, workoutName?: string) => void;
  onMenuPress: (workout: any) => void;
  onAddExercise: (workoutId: string | number) => void;
  onReplaceExercise: (workoutId: string | number, exerciseId: string | number) => void;
  onMoveExercise: (workoutID: string | number, exerciseID: string | number, direction: "up" | "down") => Promise<void>;
  onSkipExercise: (workoutID: string | number, exerciseID: string | number) => Promise<void>;
  onDeleteExercise: (workoutID: string | number, exerciseID: string | number) => Promise<void>;
  onMoveSet: (workoutID: string | number, exerciseID: string | number, setID: string | number, direction: "up" | "down") => Promise<void>;
  onAddSetAbove: (workoutID: string | number, exerciseID: string | number, setIndex: number, setTemplate: any) => Promise<void>;
  onAddSetBelow: (workoutID: string | number, exerciseID: string | number, setIndex: number, setTemplate: any) => Promise<void>;
  onSkipSet: (workoutID: string | number, exerciseID: string | number, setID: string | number) => Promise<void>;
  onDeleteSet: (workoutID: string | number, exerciseID: string | number, setID: string | number) => Promise<void>;
}

export default function WorkoutCard({
  workout,
  unitSystem,
  planID,
  cycleID,
  onPress,
  onMenuPress,
  onAddExercise,
  onReplaceExercise,
  onMoveExercise,
  onSkipExercise,
  onDeleteExercise,
  onMoveSet,
  onAddSetAbove,
  onAddSetBelow,
  onSkipSet,
  onDeleteSet,
}: WorkoutCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <Pressable
      style={[
        styles.workoutCard,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: workout.completed
            ? theme.colors.status.success.border
            : theme.colors.border,
        },
      ]}
      onPress={() => onPress(workout.id, workout.name)}
    >
      <View style={styles.workoutHeader}>
        <View style={styles.workoutTitleContainer}>
          <Text
            style={[styles.workoutName, { color: theme.colors.text.primary }]}
            numberOfLines={1}
          >
            {workout.name}
          </Text>
          {workout.completed && (
            <View
              style={[
                styles.completedBadge,
                {
                  backgroundColor: theme.colors.status.success.background,
                },
              ]}
            >
              <MaterialIcons
                name="check-circle"
                size={16}
                color={theme.colors.status.success.text}
              />
            </View>
          )}
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onMenuPress(workout);
          }}
        >
          <MaterialIcons
            name="more-vert"
            size={24}
            color={theme.colors.text.secondary}
          />
        </Pressable>
      </View>

      <Text style={[styles.workoutInfo, { color: theme.colors.text.secondary }]}>
        {t("general.last_updated")}{" "}
        {workout.updated_at
          ? new Date(workout.updated_at).toLocaleDateString()
          : t("general.n_a")}
        {"\n"}
        {t("general.completed")}:{" "}
        <Text
          style={{
            color: workout.completed
              ? theme.colors.status.success.text
              : theme.colors.status.error.text,
            fontWeight: "600",
          }}
        >
          {workout.completed ? t("general.yes") : t("general.no")}
        </Text>
        {workout.completed && workout.estimated_calories && (
          <>
            {"\n"}
            <Text style={{ color: theme.colors.text.tertiary }}>
              {t("workout_plan_single.estimated_calories_burned")}: ~
              {workout.estimated_calories}
            </Text>
          </>
        )}
      </Text>

      {workout.workout_exercises && workout.workout_exercises.length > 0 && (
        <View style={styles.exercisesContainer}>
          <View style={styles.exerciseHeaderRow}>
            <Text style={[styles.exercisesLabel, { color: theme.colors.text.secondary }]}>
              {t("workout_plan_single.exercises")}: {workout.workout_exercises.length}
            </Text>
            <Pressable
              style={[
                styles.addExerciseButton,
                { backgroundColor: theme.colors.button.secondary?.background || theme.colors.card.background },
              ]}
              onPress={() => onAddExercise(workout.id)}
            >
              <MaterialIcons
                name="add"
                size={16}
                color={theme.colors.button.secondary?.text || theme.colors.button.primary.background}
              />
              <Text
                style={[
                  styles.addExerciseButtonText,
                  { color: theme.colors.button.secondary?.text || theme.colors.button.primary.background },
                ]}
              >
                {t("add_workout_exercise_modal.add_exercise_button")}
              </Text>
            </Pressable>
          </View>
          <WorkoutExerciseList
            exercises={workout.workout_exercises}
            unitSystem={unitSystem}
            planID={planID}
            cycleID={cycleID}
            workoutID={workout.id}
            onReplaceExercise={(exerciseId) => onReplaceExercise(workout.id, exerciseId)}
            onMoveExercise={onMoveExercise}
            onSkipExercise={onSkipExercise}
            onDeleteExerciseWithConfirm={onDeleteExercise}
            onMoveSet={onMoveSet}
            onAddSetAbove={onAddSetAbove}
            onAddSetBelow={onAddSetBelow}
            onSkipSet={onSkipSet}
            onDeleteSet={onDeleteSet}
          />
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  workoutCard: {
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[5],
    borderWidth: 2,
    gap: theme.spacing[3],
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workoutTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    marginRight: theme.spacing[2],
  },
  workoutName: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    flex: 1,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutInfo: {
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },
  exercisesContainer: {
    marginTop: theme.spacing[3],
    gap: theme.spacing[3],
  },
  exerciseHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exercisesLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[2.5],
    paddingVertical: theme.spacing[1.5],
    borderRadius: theme.borderRadius['2xl'],
  },
  addExerciseButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
  },
});


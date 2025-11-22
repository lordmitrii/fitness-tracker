import { useCallback } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

interface UseWorkoutManagementParams {
  planID: string | number;
  cycleID: string | number;
  deleteWorkoutMutation: (params: { workoutID: string | number }) => Promise<any>;
}

export function useWorkoutManagement({
  planID,
  cycleID,
  deleteWorkoutMutation,
}: UseWorkoutManagementParams) {
  const { t } = useTranslation();

  const editWorkout = useCallback(
    (workoutId: string | number, workoutName?: string) => {
      router.push({
        pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]/update-workout/[workoutID]",
        params: {
          planID: String(planID),
          cycleID: String(cycleID),
          workoutID: String(workoutId),
          workoutName: workoutName ?? "",
        },
      });
    },
    [planID, cycleID]
  );

  const deleteWorkout = useCallback(
    (workout: { id: string | number; name?: string }) => {
      Alert.alert(
        t("menus.confirm_delete_workout_title") || "Delete Workout",
        t("menus.confirm_delete_workout", { workoutName: workout.name }) ||
          `Are you sure you want to delete "${workout.name}"? This action cannot be undone.`,
        [
          {
            text: t("general.cancel") || "Cancel",
            style: "cancel",
          },
          {
            text: t("general.delete") || "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteWorkoutMutation({ workoutID: workout.id });
              } catch (error) {
                console.error("Error deleting workout:", error);
              }
            },
          },
        ]
      );
    },
    [deleteWorkoutMutation, t]
  );

  return {
    editWorkout,
    deleteWorkout,
  };
}


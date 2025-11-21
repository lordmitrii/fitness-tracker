import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { useTheme } from "@/src/context/ThemeContext";
import WorkoutForm from "@/src/components/workout/WorkoutForm";
import useCycleData from "@/src/hooks/data/useCycleData";
import { ErrorState, LoadingState } from "@/src/states";

export default function UpdateWorkoutScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { planID, cycleID, workoutID } = useLocalSearchParams<{
    planID?: string | string[];
    cycleID?: string | string[];
    workoutID?: string | string[];
  }>();

  const resolvedPlanID = Array.isArray(planID) ? planID[0] : planID;
  const resolvedCycleID = Array.isArray(cycleID) ? cycleID[0] : cycleID;
  const resolvedWorkoutID = Array.isArray(workoutID) ? workoutID[0] : workoutID;

  const { workouts, loading, error, refetchAll, mutations } = useCycleData({
    planID: resolvedPlanID,
    cycleID: resolvedCycleID,
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const targetWorkout = useMemo(
    () =>
      workouts.find(
        (w) => String(w.id) === String(resolvedWorkoutID ?? "")
      ),
    [workouts, resolvedWorkoutID]
  );

  const handleUpdate = useCallback(
    async (payload: { name: string }) => {
      if (!resolvedPlanID || !resolvedCycleID || !resolvedWorkoutID) return;
      try {
        setServerError(null);
        await mutations.updateWorkout.mutateAsync({
          workoutID: resolvedWorkoutID,
          payload,
        });
        router.replace({
          pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
          params: {
            planID: String(resolvedPlanID),
            cycleID: String(resolvedCycleID),
          },
        });
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ||
          (err instanceof Error ? err.message : String(err));
        setServerError(message);
      }
    },
    [mutations.updateWorkout, resolvedPlanID, resolvedCycleID, resolvedWorkoutID]
  );

  if (!resolvedPlanID || !resolvedCycleID || !resolvedWorkoutID) {
    return (
      <ErrorState
        error={t("workout_form.invalid_route_params") || "Workout context missing"}
        onRetry={() => router.replace("/(tabs)/workout-plans")}
      />
    );
  }

  if (loading && !targetWorkout) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("general.update_workout") || "Update Workout",
          })}
        />
        <LoadingState message={t("general.loading") || "Loading..."} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("general.update_workout") || "Update Workout",
          })}
        />
        <ErrorState error={error} onRetry={refetchAll} />
      </>
    );
  }

  if (!targetWorkout) {
    return (
      <ErrorState
        error={t("workout_form.workout_not_found") || "Workout not found"}
        onRetry={refetchAll}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.update_workout") || "Update Workout",
        })}
      />
      <WorkoutForm
        initialData={{ name: targetWorkout?.name }}
        label={t("workout_form.update_workout") || "Update Workout"}
        submitLabel={t("general.update") || "Update"}
        onSubmit={handleUpdate}
        submitting={mutations.updateWorkout.isPending}
        errorMessage={serverError}
      />
    </>
  );
}


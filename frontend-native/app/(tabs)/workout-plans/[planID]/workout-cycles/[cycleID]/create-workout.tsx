import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { useTheme } from "@/src/context/ThemeContext";
import WorkoutForm from "@/src/components/workout/WorkoutForm";
import useCycleData from "@/src/hooks/data/useCycleData";
import { ErrorState } from "@/src/states";

export default function CreateWorkoutScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { planID, cycleID } = useLocalSearchParams<{
    planID?: string | string[];
    cycleID?: string | string[];
  }>();
  const resolvedPlanID = Array.isArray(planID) ? planID[0] : planID;
  const resolvedCycleID = Array.isArray(cycleID) ? cycleID[0] : cycleID;

  const { mutations } = useCycleData({
    planID: resolvedPlanID,
    cycleID: resolvedCycleID,
    skipQuery: true,
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const handleCreate = useCallback(
    async (payload: { name: string }) => {
      if (!resolvedPlanID || !resolvedCycleID) return;
      try {
        setServerError(null);
        await mutations.addWorkout.mutateAsync({ payload });
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
    [mutations.addWorkout, resolvedPlanID, resolvedCycleID]
  );

  if (!resolvedPlanID || !resolvedCycleID) {
    return (
      <ErrorState
        error={t("workout_form.invalid_route_params") || "Workout context missing"}
        onRetry={() => router.replace("/(tabs)/workout-plans")}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.create_workout") || "Create Workout",
        })}
      />
      <WorkoutForm
        label={t("workout_form.create_workout") || "Create Workout"}
        submitLabel={t("general.create") || "Create"}
        onSubmit={handleCreate}
        submitting={mutations.addWorkout.isPending}
        errorMessage={serverError}
      />
    </>
  );
}


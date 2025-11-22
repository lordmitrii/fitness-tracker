import { useCallback } from "react";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

interface UseCreateWorkoutPlanParams {
  createPlanMutation: (params: {
    name: string;
    active: boolean;
    workouts: any[];
  }) => Promise<any>;
}

export function useCreateWorkoutPlan({
  createPlanMutation,
}: UseCreateWorkoutPlanParams) {
  const { t } = useTranslation();

  const validate = useCallback(
    (name: string): string | null => {
      if (!name.trim()) {
        return t("workout_plans.name_required") || "Plan name is required";
      }
      return null;
    },
    [t]
  );

  const createPlan = useCallback(
    async (name: string, active: boolean = true) => {
      const validationError = validate(name);
      if (validationError) {
        return { error: validationError };
      }

      try {
        const plan = await createPlanMutation({
          name: name.trim(),
          active,
          workouts: [],
        });

        if (plan?.id) {
          router.replace({
            pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
            params: {
              planID: String(plan.id),
              cycleID: String(plan.current_cycle_id),
            },
          });
        }
        return { success: true, plan };
      } catch (err) {
        console.error("Error creating workout plan:", err);
        return {
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
    [createPlanMutation, validate]
  );

  return {
    createPlan,
    validate,
  };
}


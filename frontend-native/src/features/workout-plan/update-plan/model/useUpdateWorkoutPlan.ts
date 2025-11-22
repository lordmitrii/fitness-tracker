import { useCallback } from "react";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { validateWorkoutPlanName } from "./Validation";

interface UseUpdateWorkoutPlanParams {
  planID: number | string;
  updatePlanMutation: (params: { planID: number; payload: { name: string } }) => Promise<any>;
}

export function useUpdateWorkoutPlan({
  planID,
  updatePlanMutation,
}: UseUpdateWorkoutPlanParams) {
  const { t } = useTranslation();

  const validate = useCallback(
    (name: string) => validateWorkoutPlanName(name, t),
    [t]
  );

  const updatePlan = useCallback(
    async (name: string) => {
      const validationErrors = validate(name);
      if (Object.keys(validationErrors).length) {
        return { errors: validationErrors };
      }

      try {
        await updatePlanMutation({
          planID: Number(planID),
          payload: { name: name.trim() },
        });
        router.replace("/(tabs)/workout-plans");
        return { success: true };
      } catch (err) {
        console.error("Error updating workout plan:", err);
        return { error: err };
      }
    },
    [planID, updatePlanMutation, validate]
  );

  return {
    updatePlan,
    validate,
  };
}


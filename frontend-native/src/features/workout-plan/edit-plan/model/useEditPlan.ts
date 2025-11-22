import { useCallback } from "react";
import { router } from "expo-router";

export function useEditPlan() {
  const editPlan = useCallback((planID: number | string) => {
    router.push({
      pathname: "/(tabs)/workout-plans/update-workout-plan/[planID]",
      params: { planID: String(planID) },
    });
  }, []);

  return { editPlan };
}


import { useCallback } from "react";

interface UseCompleteCycleParams {
  allWorkoutsCompleted: boolean;
  completeCycleMutation: () => Promise<any>;
}

export function useCompleteCycle({
  allWorkoutsCompleted,
  completeCycleMutation,
}: UseCompleteCycleParams) {
  const completeCycle = useCallback(async () => {
    if (!allWorkoutsCompleted) {
      return;
    }
    await completeCycleMutation();
  }, [allWorkoutsCompleted, completeCycleMutation]);

  return { completeCycle };
}


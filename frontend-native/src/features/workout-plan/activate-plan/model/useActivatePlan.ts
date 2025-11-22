import { useCallback } from "react";

interface UseActivatePlanParams {
  activatePlanMutation: (params: { planID: number | string }) => Promise<any>;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useActivatePlan({
  activatePlanMutation,
  onSuccess,
  onError,
}: UseActivatePlanParams) {
  const activatePlan = useCallback(
    async (planID: number | string) => {
      try {
        await activatePlanMutation({ planID });
        onSuccess?.();
      } catch (error) {
        console.error("Error activating plan:", error);
        onError?.(error);
      }
    },
    [activatePlanMutation, onSuccess, onError]
  );

  return { activatePlan };
}


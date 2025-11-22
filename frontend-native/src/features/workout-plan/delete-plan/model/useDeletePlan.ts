import { useCallback } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

interface UseDeletePlanParams {
  deletePlanMutation: (params: { planID: number | string }) => Promise<any>;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useDeletePlan({
  deletePlanMutation,
  onSuccess,
  onError,
}: UseDeletePlanParams) {
  const { t } = useTranslation();

  const deletePlan = useCallback(
    (plan: { id: number | string; name: string }) => {
      Alert.alert(
        t("menus.confirm_delete_workout_plan_title") || "Delete Workout Plan",
        t("menus.confirm_delete_workout_plan", { planName: plan.name }) ||
          `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
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
                await deletePlanMutation({ planID: plan.id });
                onSuccess?.();
              } catch (error) {
                console.error("Error deleting plan:", error);
                onError?.(error);
              }
            },
          },
        ]
      );
    },
    [deletePlanMutation, onSuccess, onError, t]
  );

  return { deletePlan };
}


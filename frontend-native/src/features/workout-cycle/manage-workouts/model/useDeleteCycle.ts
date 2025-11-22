import { useCallback } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

interface Cycle {
  id?: string | number;
  name?: string;
  previous_cycle_id?: string | number | null;
  next_cycle_id?: string | number | null;
}

interface UseDeleteCycleParams {
  planID: string | number;
  deleteCycleMutation: (params: {
    previousCycleID?: string | number | null;
    nextCycleID?: string | number | null;
  }) => Promise<any>;
}

export function useDeleteCycle({
  planID,
  deleteCycleMutation,
}: UseDeleteCycleParams) {
  const { t } = useTranslation();

  const deleteCycle = useCallback(
    (cycle: Cycle) => {
      Alert.alert(
        t("menus.confirm_delete_cycle_title") || "Delete Cycle",
        t("menus.confirm_delete_cycle", { cycleName: cycle.name }) ||
          `Are you sure you want to delete "${cycle.name}"?`,
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
                await deleteCycleMutation({
                  previousCycleID: cycle.previous_cycle_id,
                  nextCycleID: cycle.next_cycle_id,
                });
                if (cycle.next_cycle_id) {
                  router.replace({
                    pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
                    params: {
                      planID: String(planID),
                      cycleID: String(cycle.next_cycle_id),
                    },
                  });
                } else if (cycle.previous_cycle_id) {
                  router.replace({
                    pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
                    params: {
                      planID: String(planID),
                      cycleID: String(cycle.previous_cycle_id),
                    },
                  });
                } else {
                  router.back();
                }
              } catch (error) {
                console.error("Error deleting cycle:", error);
              }
            },
          },
        ]
      );
    },
    [planID, deleteCycleMutation, t]
  );

  return { deleteCycle };
}


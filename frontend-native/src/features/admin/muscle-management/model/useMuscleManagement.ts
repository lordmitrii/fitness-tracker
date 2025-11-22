import { useCallback } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

interface UseMuscleManagementParams {
  deleteMuscleGroupMutation: (muscleID: string | number) => void;
  createMuscleGroupMutation: (payload: {
    name: string;
    auto_translate: boolean;
  }) => Promise<any>;
}

export function useMuscleManagement({
  deleteMuscleGroupMutation,
  createMuscleGroupMutation,
}: UseMuscleManagementParams) {
  const { t } = useTranslation();

  const deleteMuscle = useCallback(
    (muscleID: string | number) => {
      Alert.alert(
        t("general.delete"),
        t("admin.exercises.confirm_delete_muscle_group") ||
          "Delete this muscle group?",
        [
          { text: t("general.cancel"), style: "cancel" },
          {
            text: t("general.delete"),
            style: "destructive",
            onPress: () => deleteMuscleGroupMutation(muscleID),
          },
        ]
      );
    },
    [deleteMuscleGroupMutation, t]
  );

  const createMuscleGroup = useCallback(
    async (payload: { name: string; auto_translate: boolean }) => {
      try {
        await createMuscleGroupMutation(payload);
        return { success: true };
      } catch (err) {
        const errorMessage =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || (err instanceof Error ? err.message : String(err));
        return { error: errorMessage };
      }
    },
    [createMuscleGroupMutation]
  );

  return {
    deleteMuscle,
    createMuscleGroup,
  };
}


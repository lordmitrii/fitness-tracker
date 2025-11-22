import { useCallback } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

interface UseExerciseManagementParams {
  deleteExerciseMutation: (exerciseID: string | number) => void;
  createExerciseMutation: (payload: {
    name: string;
    muscle_group_id: string | number;
    auto_translate: boolean;
    is_time_based: boolean;
    is_bodyweight: boolean;
  }) => Promise<any>;
}

export function useExerciseManagement({
  deleteExerciseMutation,
  createExerciseMutation,
}: UseExerciseManagementParams) {
  const { t } = useTranslation();

  const deleteExercise = useCallback(
    (exerciseID: string | number) => {
      Alert.alert(
        t("general.delete"),
        t("admin.exercises.confirm_delete_exercise") ||
          "Delete this exercise?",
        [
          { text: t("general.cancel"), style: "cancel" },
          {
            text: t("general.delete"),
            style: "destructive",
            onPress: () => deleteExerciseMutation(exerciseID),
          },
        ]
      );
    },
    [deleteExerciseMutation, t]
  );

  const createExercise = useCallback(
    async (payload: {
      name: string;
      muscle_group_id: string | number;
      auto_translate: boolean;
      is_time_based: boolean;
      is_bodyweight: boolean;
    }) => {
      try {
        await createExerciseMutation(payload);
        return { success: true };
      } catch (err) {
        const errorMessage =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || (err instanceof Error ? err.message : String(err));
        return { error: errorMessage };
      }
    },
    [createExerciseMutation]
  );

  return {
    deleteExercise,
    createExercise,
  };
}


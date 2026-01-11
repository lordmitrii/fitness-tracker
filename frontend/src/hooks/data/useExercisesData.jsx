import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import api from "../../api";
import { useCallback, useMemo } from "react";
import { QK } from "../../utils/queryKeys";

async function fetchExercisesBundle() {
  const [res1, res2, res3] = await Promise.all([
    api.get("exercises/"),
    api.get("individual-exercises"),
    api.get("muscle-groups/"),
  ]);

  const pool = (res1?.data ?? []).map((ex) => ({ ...ex, source: "pool" }));
  const customs = (res2?.data ?? [])
    .filter((ex) => !ex.exercise_id)
    .map((ex) => ({ ...ex, source: "custom" }));

  return {
    exercises: [...pool, ...customs],
    muscleGroups: res3?.data ?? [],
    poolOnlyExercises: pool,
  };
}

export default function useExercisesData(onError) {
  const queryClient = useQueryClient();

  const { data, error, isLoading, isFetched, refetch, isFetching } = useQuery({
    queryKey: QK.exercisesBundle,
    queryFn: fetchExercisesBundle,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    onError,
    select: (data) =>
      data ?? { exercises: [], muscleGroups: [], poolOnlyExercises: [] },
    placeholderData: (prev) => prev,
  });

  const setExercisesCache = useCallback(
    (next) => {
      queryClient.setQueryData(QK.exercisesBundle, (old) => {
        const base = old ?? {
          exercises: [],
          muscleGroups: [],
          poolOnlyExercises: [],
        };
        const result = typeof next === "function" ? next(base) : next;
        return {
          exercises: result?.exercises ?? base.exercises,
          muscleGroups: result?.muscleGroups ?? base.muscleGroups,
          poolOnlyExercises:
            result?.poolOnlyExercises ?? base.poolOnlyExercises,
        };
      });
    },
    [queryClient]
  );

  const invalidateExercisesBundle = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QK.exercisesBundle });
  }, [queryClient]);

  const createIndividualExercise = useMutation({
    mutationFn: async ({
      exercise_id, // present for pool item
      name, // present for custom
      muscle_group_id,
      is_bodyweight,
      is_time_based,
    }) => {
      const { data } = await api.post("individual-exercises", {
        exercise_id,
        name,
        muscle_group_id,
        is_bodyweight,
        is_time_based,
      });
      return data;
    },
    onSuccess: (individualExercise) => {
      // add to cache if it's a custom exercise
      if (!individualExercise?.exercise_id) {
        queryClient.setQueryData(QK.exercisesBundle, (old) => {
          if (!old) return old;
          const alreadyExists = old.exercises.some((ex) => {
            if (ex.source === "custom") {
              return (
                ex.name === individualExercise.name &&
                String(ex.muscle_group_id ?? "") ===
                  String(individualExercise.muscle_group_id ?? "")
              );
            }
            return false;
          });
          if (alreadyExists) return old;
          return {
            ...old,
            exercises: [
              ...old.exercises,
              { ...individualExercise, source: "custom" },
            ],
          };
        });
      }
    },
    onError,
  });

  const attachWorkoutExercise = useMutation({
    mutationFn: async ({
      planID,
      cycleID,
      workoutID,
      replaceExerciseID, // optional
      individual_exercise_id, // required
      sets_qt,
    }) => {
      const base = `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`;
      if (replaceExerciseID) {
        const { data } = await api.post(
          `${base}/workout-exercises/${replaceExerciseID}/replace`,
          { individual_exercise_id, sets_qt }
        );
        return data;
      }
      const { data } = await api.post(`${base}/workout-exercises`, {
        individual_exercise_id,
        sets_qt,
      });
      return data;
    },
    onError,
  });

  const createExercise = useMutation({
    mutationFn: async ({
      name,
      muscle_group_id,
      auto_translate,
      is_time_based,
      is_bodyweight,
    }) => {
      const { data } = await api.post("exercises/", {
        name,
        muscle_group_id,
        auto_translate,
        is_time_based,
        is_bodyweight,
      });
      return data;
    },
    onSuccess: (newExercise) => {
      queryClient.setQueryData(QK.exercisesBundle, (old) => {
        if (!old) return old;
        return {
          ...old,
          exercises: [...old.exercises, { ...newExercise, source: "pool" }],
          poolOnlyExercises: [
            ...old.poolOnlyExercises,
            { ...newExercise, source: "pool" },
          ],
        };
      });
    },
  });

  const updateExercise = useMutation({
    mutationFn: async (exercise) => {
      const { id, name, muscle_group_id } = exercise;
      const { data } = await api.put(`exercises/${id}`, {
        name,
        muscle_group_id,
      });
      return data;
    },
    onSuccess: (updatedExercise) => {
      queryClient.setQueryData(QK.exercisesBundle, (old) => {
        if (!old) return old;
        return {
          ...old,
          exercises: old.exercises.map((ex) =>
            ex.id === updatedExercise.id ? updatedExercise : ex
          ),
        };
      });
    },
  });

  const deleteExercise = useMutation({
    mutationFn: async (exerciseID) => {
      await api.delete(`exercises/${exerciseID}`);
      return exerciseID;
    },
    onSuccess: (deletedExerciseID) => {
      queryClient.setQueryData(QK.exercisesBundle, (old) => {
        if (!old) return old;
        return {
          ...old,
          exercises: old.exercises.filter((ex) => ex.id !== deletedExerciseID),
          poolOnlyExercises: old.poolOnlyExercises.filter(
            (ex) => ex.id !== deletedExerciseID
          ),
        };
      });
    },
  });

  const createMuscleGroup = useMutation({
    mutationFn: async ({ name, auto_translate }) => {
      const { data } = await api.post("muscle-groups/", {
        name,
        auto_translate,
      });
      return data;
    },
    onSuccess: (newMuscleGroup) => {
      queryClient.setQueryData(QK.exercisesBundle, (old) => {
        if (!old) return old;
        return {
          ...old,
          muscleGroups: [...old.muscleGroups, newMuscleGroup],
        };
      });
    },
  });
  const updateMuscleGroup = useMutation({
    mutationFn: async (muscleGroup) => {
      const { id, name } = muscleGroup;
      const { data } = await api.put(`muscle-groups/${id}`, { name });
      return data;
    },
    onSuccess: (updatedMuscleGroup) => {
      queryClient.setQueryData(QK.exercisesBundle, (old) => {
        if (!old) return old;
        return {
          ...old,
          muscleGroups: old.muscleGroups.map((mg) =>
            mg.id === updatedMuscleGroup.id ? updatedMuscleGroup : mg
          ),
        };
      });
    },
  });
  const deleteMuscleGroup = useMutation({
    mutationFn: async (muscleGroupID) => {
      await api.delete(`muscle-groups/${muscleGroupID}`);
      return muscleGroupID;
    },
    onSuccess: (deletedMuscleGroupID) => {
      queryClient.setQueryData(QK.exercisesBundle, (old) => {
        if (!old) return old;
        return {
          ...old,
          muscleGroups: old.muscleGroups.filter(
            (mg) => mg.id !== deletedMuscleGroupID
          ),
        };
      });
    },
  });

  return useMemo(
    () => ({
      exercises: data?.exercises ?? [],
      muscleGroups: data?.muscleGroups ?? [],
      poolOnlyExercises: data?.poolOnlyExercises ?? [],
      error,
      loading: isLoading,
      fetchedOnce: isFetched,
      refetch,
      isFetching,
      setExercisesCache,
      invalidateExercisesBundle,
      mutations: {
        createIndividualExercise,
        attachWorkoutExercise,
        createExercise,
        updateExercise,
        deleteExercise,
        createMuscleGroup,
        updateMuscleGroup,
        deleteMuscleGroup,
      },
    }),
    [
      data,
      error,
      isLoading,
      isFetched,
      refetch,
      isFetching,
      setExercisesCache,
      invalidateExercisesBundle,
      createIndividualExercise,
      attachWorkoutExercise,
      createExercise,
      updateExercise,
      deleteExercise,
      createMuscleGroup,
      updateMuscleGroup,
      deleteMuscleGroup,
    ]
  );
}

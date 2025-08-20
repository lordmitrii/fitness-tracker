import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import api from "../../api";
import { useCallback, useMemo } from "react";

const EXERCISES_BUNDLE_QK = ["exercisesBundle"];

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
  };
}

export default function useExercisesData(onError) {
  const queryClient = useQueryClient();

  const { data, error, isLoading, isFetched, refetch, isFetching } = useQuery({
    queryKey: EXERCISES_BUNDLE_QK,
    queryFn: fetchExercisesBundle,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    onError,
    select: (data) => data ?? { exercises: [], muscleGroups: [] },
    placeholderData: (prev) => prev,
  });

  const setExercisesCache = useCallback(
    (next) => {
      queryClient.setQueryData(EXERCISES_BUNDLE_QK, (old) => {
        const base = old ?? { exercises: [], muscleGroups: [] };
        const result = typeof next === "function" ? next(base) : next;
        return {
          exercises: result?.exercises ?? base.exercises,
          muscleGroups: result?.muscleGroups ?? base.muscleGroups,
        };
      });
    },
    [queryClient]
  );

  const invalidateExercisesBundle = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: EXERCISES_BUNDLE_QK });
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
        queryClient.setQueryData(EXERCISES_BUNDLE_QK, (old) => {
          if (!old) return old;
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

  return useMemo(
    () => ({
      exercises: data?.exercises ?? [],
      muscleGroups: data?.muscleGroups ?? [],
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
    ]
  );
}

// hooks/useExercisesData.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api";

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

  const { data, isLoading, isFetched } = useQuery({
    queryKey: ["exercisesBundle"],
    queryFn: fetchExercisesBundle,
    staleTime: 5 * 60 * 1000, // cache stays fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // garbage collected after 30 minutes
    onError,
  });

  const addCustomExerciseToCache = (newExercise) => {
    queryClient.setQueryData(["exercisesBundle"], (old) => {
      if (!old) return old;
      return {
        ...old,
        exercises: [...old.exercises, { ...newExercise, source: "custom" }],
      };
    });
  };

  const resetForNextOpen = () => {
    queryClient.invalidateQueries({ queryKey: ["exercisesBundle"] });
  };

  return {
    exercises: data?.exercises ?? [],
    muscleGroups: data?.muscleGroups ?? [],
    loading: isLoading,
    fetchedOnce: isFetched,
    resetForNextOpen,
    addCustomExerciseToCache,
  };
}

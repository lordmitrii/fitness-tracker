import { useMemo } from "react";

interface Exercise {
  id: string | number;
  _label: string;
  _labelLower: string;
  muscle_group_id?: string | number | null;
}

interface UseFilterExercisesParams {
  exercises: Exercise[];
  query: string;
  muscleFilter: string | number | "all";
}

export function useFilterExercises({
  exercises,
  query,
  muscleFilter,
}: UseFilterExercisesParams) {
  const filteredExercises = useMemo(() => {
    const term = query.trim().toLowerCase();
    return exercises.filter((exercise) => {
      const matchesQuery = !term || exercise._labelLower.includes(term);
      const matchesMuscle =
        muscleFilter === "all" ||
        String(exercise.muscle_group_id ?? "") === String(muscleFilter);
      return matchesQuery && matchesMuscle;
    });
  }, [exercises, query, muscleFilter]);

  return { filteredExercises };
}


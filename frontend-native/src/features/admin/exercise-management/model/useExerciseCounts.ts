import { useMemo } from "react";

interface Exercise {
  muscle_group_id?: string | number | null;
}

export function useExerciseCounts(exercises: Exercise[]) {
  const exerciseCountByMuscle = useMemo(() => {
    const counts = new Map<string, number>();
    exercises.forEach((exercise) => {
      const key = String(exercise.muscle_group_id ?? "");
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [exercises]);

  return { exerciseCountByMuscle };
}


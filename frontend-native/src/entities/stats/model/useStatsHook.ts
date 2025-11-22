import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import api from "@/src/shared/api";
import { QK } from "@/src/shared/utils/query";
import type { ExerciseStat } from "@/src/shared/api/Types";

async function fetchExerciseStats(): Promise<ExerciseStat[]> {
  const res = await api.get("/individual-exercises/stats");
  return Array.isArray(res?.data) ? (res.data as ExerciseStat[]) : [];
}

interface UseStatsOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export default function useStatsHook({
  enabled = true,
  staleTime = 5 * 60 * 1000,
  gcTime = 30 * 60 * 1000,
}: UseStatsOptions = {}) {
  const query = useQuery({
    queryKey: QK.exerciseStats,
    queryFn: fetchExerciseStats,
    enabled,
    staleTime,
    gcTime,
    select: (data: ExerciseStat[] | undefined) => data ?? [],
    placeholderData: (previous) => previous,
  });

  const bestPerformances = useMemo(() => {
    return (query.data || [])
      .slice()
      .filter(
        (entry) =>
          entry.id !== undefined &&
          entry.id !== null &&
          typeof entry.current_weight === "number" &&
          typeof entry.current_reps === "number"
      )
      .map((entry) => {
        // ExerciseStat extends Record<string, unknown>, so we can safely access these
        const name = (entry as any).name;
        const exercise = (entry as any).exercise;
        const muscleGroup = (entry as any).muscle_group;
        return {
          id: entry.id!,
          name: name ?? undefined,
          exercise: exercise ? { slug: exercise.slug ?? undefined } : undefined,
          muscle_group: muscleGroup ? { slug: muscleGroup.slug ?? undefined } : undefined,
          current_reps: entry.current_reps ?? undefined,
          current_weight: entry.current_weight ?? undefined,
          is_bodyweight: (entry as any).is_bodyweight ?? undefined,
          is_time_based: (entry as any).is_time_based ?? undefined,
        };
      })
      .sort(
        (a, b) =>
          (Number(b.current_weight) || 0) * (Number(b.current_reps) || 0) -
          (Number(a.current_weight) || 0) * (Number(a.current_reps) || 0)
      );
  }, [query.data]);

  return {
    stats: query.data,
    bestPerformances,
    loading: query.isLoading,
    fetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}


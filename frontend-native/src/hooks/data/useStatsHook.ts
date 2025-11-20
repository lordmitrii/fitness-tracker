import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import api from "@/src/api";
import { QK } from "@/lib/utils/queryKeys";
import type { ExerciseStat } from "@/src/hooks/data/types";

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
          typeof entry.current_weight === "number" &&
          typeof entry.current_reps === "number"
      )
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


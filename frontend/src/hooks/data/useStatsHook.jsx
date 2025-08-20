import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api";
import { QK } from "../../utils/queryKeys";

async function fetchExerciseStats() {
  const res = await api.get("/individual-exercises/stats");
  return Array.isArray(res?.data) ? res.data : [];
}

export default function useStatsHook({
  enabled = true,
  staleTime = 5 * 60 * 1000,
  gcTime = 30 * 60 * 1000,
} = {}) {
  const query = useQuery({
    queryKey: QK.exerciseStats,
    queryFn: fetchExerciseStats,
    enabled,
    staleTime,
    gcTime,
    select: (data) => data ?? [],
    placeholderData: (prev) => prev,
  });

  const bestPerformances = useMemo(
    () =>
      (query.data || [])
        .slice()
        .filter((e) => e.current_weight && e.current_reps)
        .sort(
          (a, b) =>
            b.current_weight * b.current_reps -
            a.current_weight * a.current_reps
        ),
    [query.data]
  );

  return {
    stats: query.data,
    bestPerformances,

    loading: query.isLoading,
    fetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

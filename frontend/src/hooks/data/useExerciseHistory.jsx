import { useQuery } from "@tanstack/react-query";
import api from "../../api";
import { QK } from "../../utils/queryKeys";

async function fetchExerciseHistory(individualExerciseId) {
  if (!individualExerciseId) return [];
  const res = await api.get(
    `/individual-exercises/${individualExerciseId}/performance-history`
  );
  return Array.isArray(res?.data) ? res.data : [];
}

export default function useExerciseHistory(
  individualExerciseId,
  { enabled = true, staleTime = 5 * 60 * 1000, gcTime = 30 * 60 * 1000 } = {}
) {
  const query = useQuery({
    queryKey: QK.exerciseHistory(individualExerciseId),
    queryFn: () => fetchExerciseHistory(individualExerciseId),
    enabled: enabled && !!individualExerciseId,
    staleTime,
    gcTime,
    select: (data) => data ?? [],
    placeholderData: (prev) => prev,
  });

  return {
    history: query.data,
    loading: query.isLoading,
    fetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

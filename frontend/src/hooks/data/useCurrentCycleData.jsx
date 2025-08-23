import { useQuery } from "@tanstack/react-query";
import api from "../../api";
import { QK } from "../../utils/queryKeys";
import { useMemo } from "react";

export const fetchCurrentCycle = async () => {
  try {
    const res = await api.get(`/current-cycle`);
    return res?.data ?? {};
  } catch (err) {
    if (err?.response?.status === 404) return {};
    throw err;
  }
};

export default function useCurrentCycleData() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: QK.currentCycle,
    queryFn: fetchCurrentCycle,
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (data) => data ?? {},
    placeholderData: (prev) => prev,
  });

  return useMemo(
    () => ({
      currentCycle: data,
      isLoading,
      error,
      refetch,
    }),
    [data, isLoading, error, refetch]
  );
}

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import api from "@/src/api";
import { QK } from "@/lib/utils/queryKeys";
import type { Cycle } from "@/src/hooks/data/types";

export const fetchCurrentCycle = async (): Promise<Cycle> => {
  try {
    const res = await api.get("/current-cycle");
    return (res?.data as Cycle) ?? {};
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 404) {
      return {};
    }
    throw error;
  }
};

export default function useCurrentCycleData() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: QK.currentCycle,
    queryFn: fetchCurrentCycle,
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (result: Cycle | undefined) => result ?? {},
    placeholderData: (previous) => previous,
  });

  return useMemo(
    () => ({
      currentCycle: data ?? {},
      isLoading,
      error,
      refetch,
    }),
    [data, isLoading, error, refetch]
  );
}


import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import api from "@/src/api";
import { QK } from "@/lib/utils/queryKeys";
import type { VersionEntry } from "@/src/hooks/data/types";

const FALLBACK_VERSION = "0.0";

export async function fetchVersions(): Promise<VersionEntry[]> {
  const res = await api.get("versions");
  const data = res?.data;
  return Array.isArray(data) ? (data as VersionEntry[]) : [];
}

interface UseVersionsOptions {
  skipQuery?: boolean;
}

export default function useVersionsData(
  { skipQuery = false }: UseVersionsOptions = {}
) {
  const query = useQuery({
    queryKey: QK.versions,
    queryFn: fetchVersions,
    enabled: !skipQuery,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (data: VersionEntry[] | undefined) => data ?? [],
    placeholderData: (previous) => previous,
  });

  const getVersion = useCallback(
    (key: string) => {
      if (!query.data) return FALLBACK_VERSION;
      const versionObj = query.data.find((entry) => entry.key === key);
      return versionObj ? versionObj.version : FALLBACK_VERSION;
    },
    [query.data]
  );

  return useMemo(
    () => ({
      versions: query.data ?? [],
      loading: query.isLoading,
      fetching: query.isFetching,
      error: query.error,
      refetch: query.refetch,
      getVersion,
    }),
    [
      query.data,
      query.isLoading,
      query.isFetching,
      query.error,
      query.refetch,
      getVersion,
    ]
  );
}


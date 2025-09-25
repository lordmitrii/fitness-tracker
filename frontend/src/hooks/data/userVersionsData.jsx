import { useQuery } from "@tanstack/react-query";
import api from "../../api";
import { QK } from "../../utils/queryKeys";
import { useMemo, useCallback } from "react";

const FALLBACK_VERSION = "0.0";

export async function fetchVersions() {
    const res = await api.get("versions");
    return res?.data ?? {};
}

export default function useVersionsData({ skipQuery = false } = {}) {
  const query = useQuery({
    queryKey: QK.versions,
    queryFn: fetchVersions,
    enabled: !skipQuery,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (data) => data ?? {},
    placeholderData: (prev) => prev,
  });

  const getVersion = useCallback(
    (key) => {
      if (!query.data) return FALLBACK_VERSION;
      const versionObj = query.data.find((v) => v.key === key);
      return versionObj ? versionObj.version : FALLBACK_VERSION;
    }
  );

  return useMemo(
    () => ({
      versions: query.data,
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

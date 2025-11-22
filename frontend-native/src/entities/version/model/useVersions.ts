import { useVersionsData } from "@/src/shared/api/versions";

/**
 * Entity-level hook that wraps shared API versions fetcher.
 * Keeps app/widgets consuming the domain boundary instead of raw shared API.
 */
export function useVersions() {
  const { versions, loading, fetching, error, refetch, getVersion } = useVersionsData();

  return {
    versions,
    loading,
    fetching,
    error,
    refetch,
    getVersion,
  };
}

import { useMemo } from "react";

interface Stat {
  current_reps?: number | null;
  current_weight?: number | null;
}

export function useFilterStats(stats: Stat[] | undefined) {
  const filteredStats = useMemo(() => {
    if (!stats || stats.length === 0) return [];
    return stats.filter((s) => s.current_reps && s.current_weight) || [];
  }, [stats]);

  return { filteredStats };
}


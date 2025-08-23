import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { QK } from "../utils/queryKeys";
import { fetchProfile } from "../hooks/data/useProfileData";
import { fetchPlans } from "../hooks/data/usePlansData";
import { fetchCurrentCycle } from "../hooks/data/useCurrentCycleData";

export function useCacheWarmup({
  enable = true,
  minDelayMs = 1000,
  timeoutMs = 3000,
} = {}) {
  const { status, refresh, isAuth } = useAuth();
  const qc = useQueryClient();
  const [done, setDone] = useState(!enable);

  useEffect(() => {
    if (!enable) return;
    let cancelled = false;

    const finish = () => {
      sessionStorage.setItem("hasLoaded", "1");
      if (!cancelled) setDone(true);
    };

    const minDelay = new Promise((r) => setTimeout(r, minDelayMs));
    const guard = new Promise((r) => setTimeout(r, timeoutMs));

    const run = async () => {
      let finalStatus = status;
      if (status === "loading" && typeof refresh === "function") {
        finalStatus = await refresh(); // "authenticated" | "unauthenticated"
      }

      if (finalStatus !== "authenticated" || !isAuth) {
        await minDelay;
        finish();
        return;
      }

      const tasks = Promise.allSettled([
        qc.prefetchQuery({
          queryKey: QK.profile,
          queryFn: fetchProfile,
          staleTime: 5 * 60 * 1000,
        }),
        qc.prefetchQuery({
          queryKey: QK.plans,
          queryFn: fetchPlans,
          staleTime: 5 * 60 * 1000,
        }),
        qc.prefetchQuery({
          queryKey: QK.currentCycle,
          queryFn: fetchCurrentCycle,
          staleTime: 5 * 60 * 1000,
        }),
      ]);

      await Promise.all([minDelay, Promise.race([tasks, guard])]);
      finish();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [enable, minDelayMs, timeoutMs, status, isAuth, refresh, qc]);

  return done;
}

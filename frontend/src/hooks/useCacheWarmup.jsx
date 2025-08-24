import { useEffect, useState, useRef } from "react";
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
  const [done, setDone] = useState(
    () => !enable || sessionStorage.getItem("hasLoaded") === "1"
  );

  const mountedRef = useRef(true);
  const startedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enable || done || startedRef.current) return;
    startedRef.current = true;

    const finish = (label = "finish") => {
      console.log("[warmup] finish called", { label });
      if (!mountedRef.current) return;
      sessionStorage.setItem("hasLoaded", "1");
      setDone(true);
    };


    const minDelay = new Promise((r) => setTimeout(r, minDelayMs));
    const guard = new Promise((r) => setTimeout(r, timeoutMs));

    (async () => {
      console.log("[warmup] start", { status, isAuth, enable });

      let finalStatus = status;
      if (finalStatus === "loading" && typeof refresh === "function") {
        try {
          console.log("[warmup] awaiting refresh");
          finalStatus = await Promise.race([
            refresh(),
            guard.then(() => "timeout"),
          ]);
          console.log("[warmup] refresh resolved", { finalStatus });
        } catch (e) {
          console.log("[warmup] refresh threw", e);
          finalStatus = "unauthenticated";
        }
      }

      const authed = finalStatus === "authenticated" || isAuth;

      if (!authed) {
        console.log("[warmup] not authenticated, finishing");
        await minDelay;
        finish("unauth");
        return;
      }

      console.log("[warmup] authenticated, prefetching...");
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
      finish("done");
    })();
  }, [enable, minDelayMs, timeoutMs, status, isAuth, refresh, qc]);

  return done;
}

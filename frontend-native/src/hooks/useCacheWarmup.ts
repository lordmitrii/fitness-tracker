import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "@/src/context/AuthContext";
import { QK } from "@/lib/utils/queryKeys";
import { fetchProfile } from "@/src/hooks/data/useProfileData";
import { fetchPlans } from "@/src/hooks/data/usePlansData";
import { fetchCurrentCycle } from "@/src/hooks/data/useCurrentCycleData";
import { fetchSettings } from "@/src/hooks/data/useSettingsData";
import { fetchVersions } from "@/src/hooks/data/userVersionsData";

const STORAGE_KEY = "cacheWarmup:hasLoaded";

interface CacheWarmupOptions {
  enable?: boolean;
  minDelayMs?: number;
  timeoutMs?: number;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type RefreshResult = AuthStatus | "offline" | "timeout";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useCacheWarmup({
  enable = true,
  minDelayMs = 1000,
  timeoutMs = 3000,
}: CacheWarmupOptions = {}) {
  const { status, refresh, isAuth } = useAuth();
  const queryClient = useQueryClient();

  const mountedRef = useRef(true);
  const startedRef = useRef(false);

  const [hydrated, setHydrated] = useState(!enable);
  const [done, setDone] = useState(!enable);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enable) {
      setHydrated(true);
      setDone(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const flag = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && flag === "1") {
          setDone(true);
        }
      } catch (error) {
        console.warn("[warmup] failed to hydrate flag", error);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enable]);

  useEffect(() => {
    if (!enable || done || !hydrated || startedRef.current) return;
    startedRef.current = true;

    const finish = async (reason: string) => {
      if (!mountedRef.current) return;
      setDone(true);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, "1");
      } catch (error) {
        console.warn("[warmup] failed to persist flag", error);
      }
      console.log("[warmup] finish", { reason });
    };

    const minDelay = wait(minDelayMs);
    const guard = wait(timeoutMs);

    (async () => {
      console.log("[warmup] start", { status, isAuth, enable });

      let finalStatus: RefreshResult = status;

      if (finalStatus === "loading" && typeof refresh === "function") {
        try {
          finalStatus = await Promise.race<RefreshResult>([
            refresh(),
            guard.then(() => "timeout" as const),
          ]);
          console.log("[warmup] refresh resolved", { finalStatus });
        } catch (error) {
          console.warn("[warmup] refresh failed", error);
          finalStatus = "unauthenticated";
        }
      }

      const authed = finalStatus === "authenticated" || isAuth;

      if (!authed) {
        await minDelay;
        await finish("unauthenticated");
        return;
      }

      const tasks = Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: QK.profile,
          queryFn: fetchProfile,
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: QK.plans,
          queryFn: fetchPlans,
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: QK.currentCycle,
          queryFn: fetchCurrentCycle,
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: QK.settings,
          queryFn: fetchSettings,
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: QK.versions,
          queryFn: fetchVersions,
          staleTime: 5 * 60 * 1000,
        }),
      ]);

      await Promise.all([minDelay, Promise.race([tasks, guard])]);
      await finish("done");
    })();
  }, [
    enable,
    done,
    hydrated,
    minDelayMs,
    timeoutMs,
    status,
    isAuth,
    refresh,
    queryClient,
  ]);

  return done;
}

export default useCacheWarmup;

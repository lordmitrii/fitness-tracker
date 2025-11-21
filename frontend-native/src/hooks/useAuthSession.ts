import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearAuthTokens,
  hydrateAuthTokens,
  refreshAccessToken,
  setAuthTokens,
  subscribeToAuthTokens,
} from "@/src/api";
import { TokenPair } from "@/src/utils/tokenStorage";

export type SessionRefreshResult = "authenticated" | "unauthenticated" | "offline";
export type SessionRefreshReason = "manual" | "focus";

interface UseAuthSessionOptions {
  onPostRefresh?: (result: SessionRefreshResult, reason: SessionRefreshReason) => Promise<void> | void;
}

export const useAuthSession = ({
  onPostRefresh,
}: UseAuthSessionOptions = {}) => {
  const [hydrated, setHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hydrationPromiseRef = useRef<Promise<void> | null>(null);
  const refreshPromiseRef = useRef<Promise<SessionRefreshResult> | null>(null);

  const deliverPostRefresh = useCallback(
    async (result: SessionRefreshResult, reason: SessionRefreshReason) => {
      if (!onPostRefresh) return;
      try {
        await onPostRefresh(result, reason);
      } catch (err) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[auth] postRefresh handler failed", err);
        }
      }
    },
    [onPostRefresh]
  );

  const ensureHydrated = useCallback(async () => {
    if (hydrated) return;
    if (!hydrationPromiseRef.current) {
      hydrationPromiseRef.current = hydrateAuthTokens()
        .catch((err) => {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn("[auth] hydrateAuthTokens failed", err);
          }
        })
        .finally(() => {
          hydrationPromiseRef.current = null;
          setHydrated(true);
        });
    }
    await hydrationPromiseRef.current;
  }, [hydrated]);

  useEffect(() => {
    void ensureHydrated();
  }, [ensureHydrated]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthTokens(() => {
      setHydrated(true);
    });
    return unsubscribe;
  }, []);

  const refreshSession = useCallback(
    async (reason: SessionRefreshReason = "manual"): Promise<SessionRefreshResult> => {
      if (refreshPromiseRef.current) return refreshPromiseRef.current;

      const promise = (async () => {
        await ensureHydrated();
        setIsRefreshing(true);
        try {
          const token = await refreshAccessToken();
          const result: SessionRefreshResult = token ? "authenticated" : "unauthenticated";
          await deliverPostRefresh(result, reason);
          return result;
        } catch (error) {
          const err = error as { isOffline?: boolean };
          const result: SessionRefreshResult = err?.isOffline ? "offline" : "unauthenticated";
          await deliverPostRefresh(result, reason);
          if (err?.isOffline) return result;
          throw error;
        } finally {
          setIsRefreshing(false);
          refreshPromiseRef.current = null;
        }
      })();

      refreshPromiseRef.current = promise;
      return promise;
    },
    [deliverPostRefresh, ensureHydrated]
  );

  const setSessionTokens = useCallback((tokens: TokenPair) => {
    setAuthTokens(tokens);
    setHydrated(true);
  }, []);

  const clearSession = useCallback(() => {
    clearAuthTokens();
    setHydrated(true);
  }, []);

  return useMemo(
    () => ({
      hydrated,
      isRefreshing,
      refreshSession,
      setSessionTokens,
      clearSession,
      ensureHydrated,
    }),
    [hydrated, isRefreshing, refreshSession, setSessionTokens, clearSession, ensureHydrated]
  );
};

export type UseAuthSessionReturn = ReturnType<typeof useAuthSession>;


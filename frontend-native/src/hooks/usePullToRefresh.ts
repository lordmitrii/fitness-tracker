import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControlProps } from "react-native";

import { usePullToRefreshContext } from "@/src/context/PullToRefreshContext";

type RefreshHandler = () => void | Promise<void>;

interface Options {
  autoRegister?: boolean;
  minimumDurationMs?: number;
}

interface UsePullToRefreshResult {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  refreshControlProps: Pick<RefreshControlProps, "refreshing" | "onRefresh">;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function usePullToRefresh(
  handler?: RefreshHandler,
  { autoRegister = true, minimumDurationMs = 350 }: Options = {}
): UsePullToRefreshResult {
  const { refresh, setHandler } = usePullToRefreshContext();
  const handlerRef = useRef<RefreshHandler | undefined>(handler);
  handlerRef.current = handler;

  const [refreshing, setRefreshing] = useState(false);

  const run = useCallback(async () => {
    const fn = handlerRef.current ?? refresh;
    if (!fn) return;
    setRefreshing(true);
    try {
      await Promise.all([Promise.resolve(fn()), wait(minimumDurationMs)]);
    } catch (error) {
      console.error("Pull-to-refresh handler failed", error);
    } finally {
      setRefreshing(false);
    }
  }, [minimumDurationMs, refresh]);

  useEffect(() => {
    if (!autoRegister) return;
    return setHandler(run);
  }, [autoRegister, run, setHandler]);

  const refreshControlProps = useMemo(
    () => ({
      refreshing,
      onRefresh: run,
    }),
    [refreshing, run]
  );

  return {
    refreshing,
    onRefresh: run,
    refreshControlProps,
  };
}

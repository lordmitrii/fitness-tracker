import { useEffect, useRef, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

interface Options {
  onlineToastDurationMs?: number;
}

const DEFAULT_DURATION = 1800;

function isConnected(state: NetInfoState) {
  if (!state) return false;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export default function useNetworkBanner({
  onlineToastDurationMs = DEFAULT_DURATION,
}: Options = {}) {
  const [online, setOnline] = useState(true);
  const [showOnline, setShowOnline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const applyState = (state: NetInfoState) => {
      const nextOnline = isConnected(state);
      if (nextOnline) {
        setOnline(true);
        setShowOnline(true);
        clearTimer();
        timerRef.current = setTimeout(() => setShowOnline(false), onlineToastDurationMs);
      } else {
        setOnline(false);
        setShowOnline(false);
        clearTimer();
      }
    };

    const unsubscribe = NetInfo.addEventListener(applyState);

    NetInfo.fetch()
      .then(applyState)
      .catch((error) => {
        console.warn("useNetworkBanner fetch error", error);
      });

    return () => {
      clearTimer();
      unsubscribe();
    };
  }, [onlineToastDurationMs]);

  return { online, showOnline };
}

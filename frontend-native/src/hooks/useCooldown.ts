import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

interface UseCooldownResult {
  cooldown: number;
  start: (seconds: number) => Promise<void>;
  clear: () => Promise<void>;
  isActive: boolean;
}

type Timer = ReturnType<typeof setInterval> | null;

export default function useCooldown(
  storageKey = "cooldown:default"
): UseCooldownResult {
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<Timer>(null);
  const expiryRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const persistExpiry = useCallback(
    async (expiresAt: number | null) => {
      expiryRef.current = expiresAt;
      try {
        if (expiresAt && Number.isFinite(expiresAt)) {
          await AsyncStorage.setItem(storageKey, String(expiresAt));
        } else {
          await AsyncStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.warn("useCooldown persist error", error);
      }
    },
    [storageKey]
  );

  const sync = useCallback(() => {
    const expiresAt = expiryRef.current;
    if (!expiresAt) {
      void persistExpiry(null);
      setCooldown(0);
      clearTimer();
      return;
    }

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));
    setCooldown(remaining);

    if (remaining === 0) {
      void persistExpiry(null);
      clearTimer();
    }
  }, [clearTimer, persistExpiry]);

  const start = useCallback(
    async (seconds: number) => {
      clearTimer();
      const duration = Number.isFinite(seconds) && seconds > 0 ? seconds : 60;
      const expiresAt = Date.now() + duration * 1000;
      await persistExpiry(expiresAt);
      sync();
      timerRef.current = setInterval(sync, 1000);
    },
    [clearTimer, persistExpiry, sync]
  );

  const clear = useCallback(async () => {
    await persistExpiry(null);
    setCooldown(0);
    clearTimer();
  }, [persistExpiry, clearTimer]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (cancelled) return;
        const parsed = raw ? Number(raw) : NaN;
        expiryRef.current = Number.isFinite(parsed) ? parsed : null;
        sync();
        if (expiryRef.current && expiryRef.current > Date.now()) {
          timerRef.current = setInterval(sync, 1000);
        }
      } catch (error) {
        console.warn("useCooldown hydrate error", error);
      }
    };

    hydrate();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        sync();
      }
    });

    return () => {
      cancelled = true;
      sub.remove();
      clearTimer();
    };
  }, [storageKey, sync, clearTimer]);

  return {
    cooldown,
    start,
    clear,
    isActive: cooldown > 0,
  };
}

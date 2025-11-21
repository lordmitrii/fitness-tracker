import { useEffect, useRef, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useCooldown(
  storageKey: string = "cooldown:default"
) {
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const readExpiry = useCallback(async (): Promise<number | null> => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const n = raw ? Number(raw) : NaN;
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const writeExpiry = useCallback(
    async (expiresAtMs: number | null) => {
      try {
        if (expiresAtMs && Number.isFinite(expiresAtMs)) {
          await AsyncStorage.setItem(storageKey, String(expiresAtMs));
        } else {
          await AsyncStorage.removeItem(storageKey);
        }
      } catch {
      }
    },
    [storageKey]
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const sync = useCallback(async () => {
    const now = Date.now();
    const exp = await readExpiry();
    const remaining = exp ? Math.max(0, Math.ceil((exp - now) / 1000)) : 0;
    setCooldown(remaining);
    if (remaining === 0) {
      await writeExpiry(null);
      clearTimer();
    }
  }, [readExpiry, writeExpiry, clearTimer]);

  const start = useCallback(
    async (seconds: number) => {
      clearTimer();
      const secs = Number.isFinite(seconds) && seconds > 0 ? seconds : 60;
      const expiresAt = Date.now() + secs * 1000;
      await writeExpiry(expiresAt);
      await sync();
      timerRef.current = setInterval(sync, 1000);
    },
    [writeExpiry, sync, clearTimer]
  );

  const clear = useCallback(async () => {
    await writeExpiry(null);
    setCooldown(0);
    clearTimer();
  }, [writeExpiry, clearTimer]);

  useEffect(() => {
        sync();

    const hasRemaining = async () => {
      const exp = await readExpiry();
      return exp && exp > Date.now();
    };

    hasRemaining().then((has) => {
      if (has && !timerRef.current) {
          timerRef.current = setInterval(sync, 1000);
      }
    });

    return () => {
      clearTimer();
    };
  }, [sync, readExpiry, clearTimer]);

  return { cooldown, start, clear, isActive: cooldown > 0 };
}

export { useCooldown };

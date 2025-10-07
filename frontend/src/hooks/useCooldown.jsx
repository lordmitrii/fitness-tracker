import { useEffect, useRef, useState, useCallback } from "react";

export default function useCooldown(
  storageKey = "cooldown:default",
  storage = typeof window !== "undefined" ? window.sessionStorage : null
) {
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  const readExpiry = useCallback(() => {
    if (!storage) return null;
    const raw = storage.getItem(storageKey);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [storage, storageKey]);

  const writeExpiry = useCallback(
    (expiresAtMs) => {
      if (!storage) return;
      if (expiresAtMs && Number.isFinite(expiresAtMs)) {
        storage.setItem(storageKey, String(expiresAtMs));
      } else {
        storage.removeItem(storageKey);
      }
    },
    [storage, storageKey]
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const sync = useCallback(() => {
    const now = Date.now();
    const exp = readExpiry();
    const remaining = exp ? Math.max(0, Math.ceil((exp - now) / 1000)) : 0;
    setCooldown(remaining);
    if (remaining === 0) {
      writeExpiry(null);
      clearTimer();
    }
  }, [readExpiry, writeExpiry, clearTimer]);

  const start = useCallback(
    (seconds) => {
      clearTimer();
      const secs = Number.isFinite(seconds) && seconds > 0 ? seconds : 60;
      const expiresAt = Date.now() + secs * 1000;
      writeExpiry(expiresAt);
      sync();
      timerRef.current = setInterval(sync, 1000);
    },
    [writeExpiry, sync, clearTimer]
  );

  const clear = useCallback(() => {
    writeExpiry(null);
    setCooldown(0);
    clearTimer();
  }, [writeExpiry, clearTimer]);

  useEffect(() => {
    sync();

    const onVisibility = () => sync();
    const onStorage = (e) => {
      if (e.key === storageKey) sync();
    };

    if (typeof document !== "undefined")
      document.addEventListener("visibilitychange", onVisibility);
    if (typeof window !== "undefined")
      window.addEventListener("storage", onStorage);

    const hasRemaining = readExpiry() && readExpiry() > Date.now();
    if (hasRemaining && !timerRef.current) {
      timerRef.current = setInterval(sync, 1000);
    }

    return () => {
      if (typeof document !== "undefined")
        document.removeEventListener("visibilitychange", onVisibility);
      if (typeof window !== "undefined")
        window.removeEventListener("storage", onStorage);
      clearTimer();
    };
  }, [sync, readExpiry, clearTimer, storageKey]);

  return { cooldown, start, clear, isActive: cooldown > 0 };
}

export { useCooldown };

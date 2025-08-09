// hooks/useCooldown.ts
import { useEffect, useRef, useState } from "react";

export default function useCooldown() {
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  const clear = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = (seconds) => {
    clear();
    const secs = Number.isFinite(seconds) && seconds > 0 ? seconds : 60;
    setCooldown(secs);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clear();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => clear, []);

  return { cooldown, start, clear };
}

export { useCooldown };

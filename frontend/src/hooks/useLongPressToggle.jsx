import { useRef, useEffect } from "react";

const TIME_TO_PRESS = 4000;

export function useLongPressToggle(toggle) {
  const timer = useRef(null);

  useEffect(() => {
    const start = () => {
      timer.current = setTimeout(() => toggle(), TIME_TO_PRESS);
    };
    const cancel = () => {
      if (timer.current) clearTimeout(timer.current);
    };

    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchend", cancel, { passive: true });
    document.addEventListener("touchmove", cancel, { passive: true });
    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchend", cancel);
      document.removeEventListener("touchmove", cancel);
    };
  }, [toggle]);
}

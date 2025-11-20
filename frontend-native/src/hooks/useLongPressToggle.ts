import { useCallback, useEffect, useRef } from "react";
import { GestureResponderEvent } from "react-native";

const DEFAULT_DURATION = 4000;

interface LongPressHandlers {
  onPressIn: (event: GestureResponderEvent) => void;
  onPressOut: (event: GestureResponderEvent) => void;
  onResponderTerminate: (event: GestureResponderEvent) => void;
  cancel: () => void;
}

export function useLongPressToggle(
  toggle: () => void,
  durationMs: number = DEFAULT_DURATION
): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    cancel();
    timerRef.current = setTimeout(() => {
      toggle();
      timerRef.current = null;
    }, durationMs);
  }, [cancel, toggle, durationMs]);

  useEffect(() => cancel, [cancel]);

  const handlePressIn = useCallback(
    (_event: GestureResponderEvent) => {
      start();
    },
    [start]
  );

  const handlePressOut = useCallback(
    (_event: GestureResponderEvent) => {
      cancel();
    },
    [cancel]
  );

  return {
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
    onResponderTerminate: handlePressOut,
    cancel,
  };
}

export default useLongPressToggle;

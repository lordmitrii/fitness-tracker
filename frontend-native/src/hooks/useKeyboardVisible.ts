import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardEvent,
  KeyboardEventName,
  Platform,
  EmitterSubscription,
} from "react-native";

interface Options {
  threshold?: number;
  settleDelayMs?: number;
}

const DEFAULT_THRESHOLD = 80;

export default function useKeyboardVisible({
  threshold = DEFAULT_THRESHOLD,
  settleDelayMs = 50,
}: Options = {}) {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    const clearHideTimer = () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };

    const handleShow = (event?: KeyboardEvent) => {
      if (!mounted) return;
      clearHideTimer();
      const height = event?.endCoordinates?.height ?? threshold;
      setVisible(height >= threshold);
    };

    const handleHide = () => {
      if (!mounted) return;
      clearHideTimer();
      if (settleDelayMs > 0) {
        hideTimer.current = setTimeout(() => {
          if (mounted) setVisible(false);
        }, settleDelayMs);
      } else {
        setVisible(false);
      }
    };

    const primaryShow: KeyboardEventName =
      Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow";
    const primaryHide: KeyboardEventName =
      Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide";

    const events: Array<[KeyboardEventName, (e?: KeyboardEvent) => void]> = [
      [primaryShow, handleShow],
      [primaryHide, handleHide],
      ["keyboardDidShow", handleShow],
      ["keyboardDidHide", handleHide],
    ];

    const subscriptions: EmitterSubscription[] = events.map(([evt, fn]) =>
      Keyboard.addListener(evt, fn)
    );

    return () => {
      mounted = false;
      clearHideTimer();
      subscriptions.forEach((sub) => sub.remove());
    };
  }, [threshold, settleDelayMs]);

  return visible;
}

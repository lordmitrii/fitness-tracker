import { useCallback, useEffect } from "react";
import { BackHandler, GestureResponderEvent, Platform } from "react-native";

interface Options {
  disabled?: boolean;
}

type CloseHandler = (event?: GestureResponderEvent) => void;

export default function useOutsidePointerClose(
  _roots: unknown,
  onClose?: CloseHandler,
  { disabled = false }: Options = {}
): CloseHandler {
  const handleClose = useCallback<CloseHandler>
    (
      (event) => {
        if (disabled) return;
        onClose?.(event);
      },
      [disabled, onClose]
    );

  useEffect(() => {
    if (disabled || !onClose) return;
    if (Platform.OS !== "android") return;

    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });

    return () => sub.remove();
  }, [disabled, onClose]);

  return handleClose;
}

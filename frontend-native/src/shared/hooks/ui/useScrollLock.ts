import { useMemo } from "react";

interface ScrollLockResult {
  scrollEnabled: boolean;
  pointerEvents: "auto" | "none";
}

export default function useScrollLock(
  isLocked: boolean
): ScrollLockResult {
  return useMemo(
    () => ({
      scrollEnabled: !isLocked,
      pointerEvents: isLocked ? "none" : "auto",
    }),
    [isLocked]
  );
}

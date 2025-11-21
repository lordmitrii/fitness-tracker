import { useState, useEffect } from "react";
import { Dimensions, ScaledSize } from "react-native";

const SM_BREAKPOINT = 640;

export default function useIsBelowSm() {
  const [isBelowSm, setIsBelowSm] = useState(() => {
    const { width } = Dimensions.get("window");
    return width < SM_BREAKPOINT;
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      "change",
      ({ window }: { window: ScaledSize }) => {
        setIsBelowSm(window.width < SM_BREAKPOINT);
}
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return isBelowSm;
}

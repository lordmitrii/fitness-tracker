import { useRef } from "react";
import type React from "react";
import { Pressable, PressableProps, View } from "react-native";

export default function useOutsidePointerClose(
  onClose: () => void,
  enabled: boolean = true
) {
  const ref = useRef<View>(null);

  return ref;
}

export function OutsidePressOverlay({
  onPress,
  enabled = true,
  children,
  style,
  ...props
}: Omit<PressableProps, 'style'> & { enabled?: boolean; style?: PressableProps['style'] }) {
  if (!enabled) {
    return <>{children}</>;
  }

  const combinedStyle = typeof style === 'function' 
    ? (state: any) => [{ flex: 1 }, style(state)]
    : [{ flex: 1 }, style];

  return (
    <Pressable
      style={combinedStyle}
      onPress={onPress}
      {...props}
    >
      {children}
    </Pressable>
  );
}

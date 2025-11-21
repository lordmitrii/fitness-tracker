import { useEffect } from "react";
import { Keyboard, ScrollView, FlatList } from "react-native";
import type { ScrollViewProps, FlatListProps } from "react-native";

export function useKeyboardDismissOnScroll(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const dismissKeyboard = () => {
      Keyboard.dismiss();
    };

    return () => {
    };
  }, [enabled]);
}

export const scrollViewPropsWithKeyboardDismiss: Partial<ScrollViewProps> = {
  onScrollBeginDrag: () => Keyboard.dismiss(),
  keyboardShouldPersistTaps: "handled" as const,
};

export const flatListPropsWithKeyboardDismiss: Partial<FlatListProps<any>> = {
  onScrollBeginDrag: () => Keyboard.dismiss(),
  keyboardShouldPersistTaps: "handled" as const,
};



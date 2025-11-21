import React, { useEffect } from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";

interface AnimatedCardProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  animationType?: "fade" | "slide" | "scale";
  duration?: number;
}

export default function AnimatedCard({
  children,
  style,
  delay = 0,
  animationType = "fade",
  duration = 300,
  ...props
}: AnimatedCardProps) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle: any = {
      opacity: opacity.value,
    };

    if (animationType === "slide") {
      baseStyle.transform = [{ translateY: translateY.value }];
    } else if (animationType === "scale") {
      baseStyle.transform = [{ scale: scale.value }];
    }

    return baseStyle;
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
        animatedStyle,
        style,
      ]}
      entering={FadeIn.duration(duration).delay(delay)}
      exiting={FadeOut.duration(duration)}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
});



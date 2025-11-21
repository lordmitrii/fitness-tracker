import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
  variant?: "text" | "circular" | "rectangular";
}

export default function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
  variant = "rectangular",
}: SkeletonLoaderProps) {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getBorderRadius = () => {
    if (variant === "circular") {
      return typeof height === "number" ? height / 2 : 50;
    }
    return borderRadius;
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: getBorderRadius(),
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
  avatarSize?: number;
}

export function SkeletonCard({
  lines = 3,
  showAvatar = false,
  avatarSize = 40,
}: SkeletonCardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {showAvatar && (
        <SkeletonLoader
          variant="circular"
          width={avatarSize}
          height={avatarSize}
          style={styles.avatar}
        />
      )}
      <View style={styles.content}>
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonLoader
            key={index}
            width={index === lines - 1 ? "60%" : "100%"}
            height={16}
            style={index < lines - 1 ? styles.line : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden",
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    gap: 8,
    justifyContent: "center",
  },
  line: {
    marginBottom: 8,
  },
});



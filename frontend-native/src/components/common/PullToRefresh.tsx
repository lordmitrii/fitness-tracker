import React, { useCallback, useRef, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { ScrollView, ScrollViewProps } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  runOnJS,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { useHapticFeedback } from "@/src/hooks/useHapticFeedback";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const REFRESH_THRESHOLD = 80;
const MAX_PULL_DISTANCE = 120;
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

type RefreshHandler = () => void | Promise<void>;

interface PullToRefreshProps extends Omit<ScrollViewProps, "onScroll"> {
  onRefresh?: RefreshHandler;
  children?: React.ReactNode;
  refreshIndicator?: React.ReactNode;
}

export default function PullToRefresh({
  onRefresh,
  children,
  refreshIndicator,
  ...scrollViewProps
}: PullToRefreshProps) {
  const { theme } = useTheme();
  const haptics = useHapticFeedback();
  const translateY = useSharedValue(0);
  const isRefreshingShared = useSharedValue(false);
  const scrollOffset = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshingShared.value) return;
    
    isRefreshingShared.value = true;
    setIsRefreshing(true);
    haptics.triggerLight();
    try {
      await Promise.resolve(onRefresh());
      haptics.triggerSuccess();
    } catch (error) {
      console.error("Pull-to-refresh handler failed:", error);
      haptics.triggerError();
    } finally {
      setTimeout(() => {
        isRefreshingShared.value = false;
        setIsRefreshing(false);
        translateY.value = withSpring(0, SPRING_CONFIG);
        rotation.value = withTiming(0, { duration: 200 });
      }, 500);
    }
  }, [onRefresh, haptics]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetX([-15, 15])
    .onStart(() => {
      if (scrollOffset.value > 5) {
        return;
      }
    })
    .onUpdate((event) => {
      if (scrollOffset.value > 5 || event.translationY < 0) {
        return;
      }

      if (!isRefreshingShared.value) {
        const pullDistance = Math.min(
          event.translationY * 0.5,
          MAX_PULL_DISTANCE
        );
        translateY.value = pullDistance;
        
        const progress = Math.min(pullDistance / REFRESH_THRESHOLD, 1);
        rotation.value = progress * 360;
      }
    })
    .onEnd(() => {
      if (isRefreshingShared.value) {
        return;
      }

      const currentTranslateY = translateY.value;
      
      if (currentTranslateY >= REFRESH_THRESHOLD) {
        translateY.value = withSpring(REFRESH_THRESHOLD, SPRING_CONFIG);
        rotation.value = withTiming(720, { duration: 300 });
        runOnJS(triggerRefresh)();
      } else {
        translateY.value = withSpring(0, SPRING_CONFIG);
        rotation.value = withTiming(0, { duration: 200 });
      }
    });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  const refreshIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [0, REFRESH_THRESHOLD * 0.5, REFRESH_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY: translateY.value - REFRESH_THRESHOLD }],
      opacity,
      height: REFRESH_THRESHOLD,
    };
  });

  const spinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const scrollViewStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: Math.max(0, translateY.value) }],
    };
  });

  const defaultRefreshIndicator = (
    <View style={styles.refreshContainer}>
      <Animated.View style={spinnerStyle}>
        <ActivityIndicator
          size="small"
          color={theme.colors.button.primary.background}
        />
      </Animated.View>
      <Text
        style={[
          styles.refreshText,
          { color: theme.colors.text.secondary },
        ]}
      >
        {isRefreshing ? "Refreshing..." : "Pull to refresh"}
      </Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GestureDetector gesture={panGesture}>
        <AnimatedScrollView
          ref={scrollViewRef}
          {...scrollViewProps}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          bounces={false}
          style={[
            { backgroundColor: theme.colors.background },
            scrollViewProps.style,
            scrollViewStyle,
          ]}
        >
          <Animated.View style={refreshIndicatorStyle}>
            {refreshIndicator || defaultRefreshIndicator}
          </Animated.View>
          {children}
        </AnimatedScrollView>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  refreshContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: "500",
  },
});


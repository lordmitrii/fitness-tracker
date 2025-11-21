import React from "react";
import { View, StyleSheet, Pressable, Animated } from "react-native";
import {
  Swipeable,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";

interface SwipeableAction {
  label?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress: () => void;
  backgroundColor?: string;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  rightActions?: SwipeableAction[];
  leftActions?: SwipeableAction[];
  onSwipeableWillOpen?: () => void;
  onSwipeableWillClose?: () => void;
}

export default function SwipeableRow({
  children,
  rightActions = [],
  leftActions = [],
  onSwipeableWillOpen,
  onSwipeableWillClose,
}: SwipeableRowProps) {
  const { theme } = useTheme();
  const swipeableRef = React.useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (rightActions.length === 0) return null;

    const translateX = dragX.interpolate({
      inputRange: [0, rightActions.length * 80],
      outputRange: [0, -rightActions.length * 80],
    });

    return (
      <View style={styles.rightActions}>
        {rightActions.map((action, index) => {
          const scale = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.actionButton,
                {
                  backgroundColor: action.backgroundColor || action.color,
                  transform: [{ translateX }, { scale }],
                },
              ]}
            >
              <Pressable
                style={styles.actionPressable}
                onPress={() => {
                  action.onPress();
                  swipeableRef.current?.close();
                }}
              >
                {action.icon && (
                  <MaterialIcons
                    name={action.icon}
                    size={24}
                    color={theme.colors.card.background}
                  />
                )}
                {action.label && (
                  <Animated.Text
                    style={[
                      styles.actionLabel,
                      { color: theme.colors.card.background },
                    ]}
                  >
                    {action.label}
                  </Animated.Text>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (leftActions.length === 0) return null;

    const translateX = dragX.interpolate({
      inputRange: [-leftActions.length * 80, 0],
      outputRange: [0, leftActions.length * 80],
    });

    return (
      <View style={styles.leftActions}>
        {leftActions.map((action, index) => {
          const scale = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.actionButton,
                {
                  backgroundColor: action.backgroundColor || action.color,
                  transform: [{ translateX }, { scale }],
                },
              ]}
            >
              <Pressable
                style={styles.actionPressable}
                onPress={() => {
                  action.onPress();
                  swipeableRef.current?.close();
                }}
              >
                {action.icon && (
                  <MaterialIcons
                    name={action.icon}
                    size={24}
                    color={theme.colors.card.background}
                  />
                )}
                {action.label && (
                  <Animated.Text
                    style={[
                      styles.actionLabel,
                      { color: theme.colors.card.background },
                    ]}
                  >
                    {action.label}
                  </Animated.Text>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  return (
    <GestureHandlerRootView>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        onSwipeableWillOpen={onSwipeableWillOpen}
        onSwipeableWillClose={onSwipeableWillClose}
        friction={2}
        overshootRight={false}
        overshootLeft={false}
      >
        {children}
      </Swipeable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  actionButton: {
    width: 80,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  actionPressable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
});



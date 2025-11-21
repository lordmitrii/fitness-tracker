import React from "react";
import Svg, { Path } from "react-native-svg";
import { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

interface ChartIconProps {
  size?: number;
  color?: string;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export function ChartUpIcon({
  size = 24,
  color,
  title,
  style,
}: ChartIconProps) {
  const { theme } = useTheme();
  const iconColor = color ?? theme.colors.text.primary;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      accessible={!!title}
      accessibilityLabel={title}
      accessibilityRole="image"
    >
      <Path
        d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
        stroke={iconColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChartDownIcon({
  size = 24,
  color,
  title,
  style,
}: ChartIconProps) {
  const { theme } = useTheme();
  const iconColor = color ?? theme.colors.text.primary;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      accessible={!!title}
      accessibilityLabel={title}
      accessibilityRole="image"
    >
      <Path
        d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181"
        stroke={iconColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChartEqualIcon({
  size = 24,
  color,
  title,
  style,
}: ChartIconProps) {
  const { theme } = useTheme();
  const iconColor = color ?? theme.colors.text.primary;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      accessible={!!title}
      accessibilityLabel={title}
      accessibilityRole="image"
    >
      <Path
        d="M5 12h14"
        stroke={iconColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


import React from "react";
import Svg, { Path } from "react-native-svg";
import { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

interface SkipIconProps {
  size?: number;
  color?: string;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export default function SkipIcon({
  size = 24,
  color,
  title,
  style,
}: SkipIconProps) {
  const { theme } = useTheme();
  // Use text.tertiary for skipped state (gray), or allow override
  const iconColor = color ?? theme.colors.text.tertiary ?? "#6B7280";
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
        d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z"
        stroke={iconColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


import { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, {
  Circle,
  Polygon,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { aggregateStats, type AggregatedRow } from "@/src/utils/exerciseStatsUtils";
import type { ExerciseStat } from "@/src/utils/exerciseStatsUtils";

interface MuscleGroupRadarProps {
  stats?: ExerciseStat[];
  title?: string;
  size?: number;
  unitSystem?: "metric" | "imperial";
}

const RADAR_SIZE = 280;
const CENTER_X = RADAR_SIZE / 2;
const CENTER_Y = RADAR_SIZE / 2;
const RADIUS = RADAR_SIZE * 0.35;

export default function MuscleGroupRadar({
  stats = [],
  title,
  size = RADAR_SIZE,
  unitSystem = "metric",
}: MuscleGroupRadarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const data = useMemo(
    () => (stats.length ? aggregateStats(stats, unitSystem) : []),
    [stats, unitSystem]
  );

  const scale = size / RADAR_SIZE;

  // Calculate points for radar chart
  const getPoint = useCallback(
    (angle: number, radius: number) => {
      const x = CENTER_X + radius * Math.cos(angle);
      const y = CENTER_Y + radius * Math.sin(angle);
      return { x: x * scale, y: y * scale };
    },
    [scale]
  );

  // Calculate angles for radar chart
  const angles = useMemo(() => {
    const count = data.length || 6;
    return Array.from({ length: count }, (_, i) => {
      return (-Math.PI / 2) + (2 * Math.PI * i) / count;
    });
  }, [data.length]);

  if (!data.length) return null;

  const radarPoints = useMemo(() => {
    return data
      .map((item, index) => {
        const radius = (RADIUS * item.norm) / 100;
        const point = getPoint(angles[index], radius);
        return `${point.x},${point.y}`;
      })
      .join(" ");
  }, [data, angles, getPoint]);

  // Create grid circles
  const gridLevels = [25, 50, 75, 100];
  const gridCircles = gridLevels.map((level) => {
    const radius = (RADIUS * level) / 100;
    return radius * scale;
  });

  // Create axis lines
  const axisLines = angles.map((angle) => {
    const point = getPoint(angle, RADIUS);
    return { x1: CENTER_X * scale, y1: CENTER_Y * scale, x2: point.x, y2: point.y };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="radarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop
              offset="0%"
              stopColor={theme.colors.button.primary.background}
              stopOpacity="0.8"
            />
            <Stop
              offset="100%"
              stopColor={theme.colors.button.primary.background}
              stopOpacity="0.3"
            />
          </LinearGradient>
        </Defs>

        {/* Grid circles */}
        {gridCircles.map((radius, index) => (
          <Circle
            key={index}
            cx={CENTER_X * scale}
            cy={CENTER_Y * scale}
            r={radius}
            fill="none"
            stroke={theme.colors.border}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, index) => (
          <Line
            key={index}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={theme.colors.border}
            strokeWidth={1}
            opacity={0.3}
          />
        ))}

        {/* Radar polygon */}
        <Polygon
          points={radarPoints}
          fill="url(#radarGradient)"
          fillOpacity={0.7}
          stroke={theme.colors.button.primary.background}
          strokeWidth={2}
        />

        {/* Data points */}
        {data.map((item, index) => {
          const radius = (RADIUS * item.norm) / 100;
          const point = getPoint(angles[index], radius);
          return (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={3 * scale}
              fill={theme.colors.card.background}
              stroke={theme.colors.button.primary.background}
              strokeWidth={1}
            />
          );
        })}

        {/* Labels */}
        {data.map((item, index) => {
          const labelRadius = RADIUS * 1.15;
          const point = getPoint(angles[index], labelRadius);
          const label = t(`muscle_group.${item.group}`) || item.group;
          
          return (
            <SvgText
              key={index}
              x={point.x}
              y={point.y}
              fontSize={12 * scale}
              fill={theme.colors.text.primary}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
      {title && (
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {title}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
});



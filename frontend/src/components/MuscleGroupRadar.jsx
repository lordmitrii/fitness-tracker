import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import React, { useMemo, useCallback, useId } from "react";
import { useTranslation } from "react-i18next";
import { aggregateStats } from "../utils/exerciseStatsUtils";

const MuscleGroupRadar = ({
  stats = [],
  title,
  className = "",
  size = 380,
}) => {
  const { t } = useTranslation();
  const gradientId = useId();

  const data = useMemo(
    () => (stats.length ? aggregateStats(stats) : []),
    [stats]
  );

  const tickStyle = useMemo(
    () => ({ fontSize: 12, fill: "var(--color-gray-900)" }),
    []
  );

  const renderTooltip = useCallback(
    ({ active, payload }) => {
      if (!active || !payload?.length) return null;
      const { group, e1RM, exerciseSlug, fallbackName } = payload[0].payload;
      const exerciseLabel = exerciseSlug
        ? t(`exercise.${exerciseSlug}`)
        : fallbackName || t("general.n_a");
      return (
        <div className="rounded-xl bg-white/90 p-2 text-sm text-black shadow-xl backdrop-blur">
          <p className="font-semibold">{t(`muscle_group.${group}`)}</p>
          <p>
            {t("exercise_stats.best_exercise")}: {exerciseLabel}
          </p>
          <p>
            {t("exercise_stats.estimated_1rm")}: {e1RM}{" "}
            {t("measurements.weight")}
          </p>
        </div>
      );
    },
    [t]
  );

  if (!data.length) return null;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <h2 className="text-title">
        {title ? title : t("exercise_stats.muscle_groups_strength")}
      </h2>
      <ResponsiveContainer width="100%" height={size}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid radialLines strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="group"
            tick={tickStyle}
            tickFormatter={(value) => t(`muscle_group.${value}`) || value}
          />
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />

          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-blue-400)"
                stopOpacity="0.8"
              />
              <stop
                offset="100%"
                stopColor="var(--color-blue-300)"
                stopOpacity="0.3"
              />
            </linearGradient>
          </defs>

          <Radar
            dataKey="norm"
            stroke="var(--color-blue-400)"
            fill={`url(#${gradientId})`}
            fillOpacity={0.7}
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-white)", strokeWidth: 1 }}
            isAnimationActive
          />
          <RechartsTooltip content={renderTooltip} isAnimationActive />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(MuscleGroupRadar);

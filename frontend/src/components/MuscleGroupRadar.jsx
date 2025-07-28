import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";
import {
  e1RM,
  EXPECTED_RATIOS,
  MAIN_GROUPS,
  BODYWEIGHT_FACTOR,
} from "../utils/exerciseStatsUtils";

function findMainGroup(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  return (
    MAIN_GROUPS.find((g) => g.labels.some((l) => lower.includes(l)))?.key ||
    null
  );
}

function aggregateStats(stats) {
  const maxByGroup = {};
  for (const {
    name,
    muscle_group,
    current_weight,
    current_reps,
    is_time_based,
    is_bodyweight,
  } of stats) {
    if (!muscle_group || !current_weight || !current_reps || is_time_based)
      continue;
    const group = findMainGroup(muscle_group.name);
    if (!group) continue;
    const est = e1RM(current_weight, current_reps);
    if (
      !maxByGroup[group] ||
      est * (is_bodyweight ? BODYWEIGHT_FACTOR : 1) >
        maxByGroup[group].weightedE1RM
    ) {
      maxByGroup[group] = {
        exercise: name,
        weightedE1RM: est * (is_bodyweight ? BODYWEIGHT_FACTOR : 1),
        e1RM: est,
        is_bodyweight,
      };
    }
  }

  const rows = MAIN_GROUPS.map(({ key }) => {   
    const entry = maxByGroup[key];
    const raw = entry?.e1RM || 0;
    const scaled =
      (raw * (entry?.is_bodyweight ? BODYWEIGHT_FACTOR : 1)) /
      EXPECTED_RATIOS[key];

    return {
      group: key,
      e1RM: Math.round(raw),
      scaled,
      exercise: entry?.exercise || null,
    };
  });

  const maxScaled = Math.max(...rows.map((d) => d.scaled), 1);
  return rows.map((d) => ({
    ...d,
    norm: Math.round((d.scaled / maxScaled) * 100),
  }));
}

const MuscleGroupRadar = ({
  stats = [],
  title,
  className = "",
  size = 380,
}) => {
  const { t } = useTranslation();
  if (!stats.length) return null;
  const data = aggregateStats(stats);

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { group, e1RM, exercise } = payload[0].payload;
    return (
      <div className="rounded-xl bg-white/90 p-2 text-sm text-black shadow-xl backdrop-blur">
        <p className="font-semibold">{group}</p>
        <p>
          {t("exercise_stats.best_exercise")}: {exercise || t("general.n_a")}
        </p>
        <p>
          {t("exercise_stats.estimated_1rm")}: {e1RM} {t("measurements.weight")}
        </p>
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <h2 className="text-body">
        {title ? title : t("exercise_stats.muscle_groups_strength")}
      </h2>
      <ResponsiveContainer width="100%" height={size}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid radialLines strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="group"
            tick={{ fontSize: 12, fill: "var(--color-gray-900)" }}
          />
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />

          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
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
            fill="url(#radarGradient)"
            fillOpacity={0.7}
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-white)", strokeWidth: 1 }}
            isAnimationActive={true}
          />
          <Tooltip content={renderTooltip} isAnimationActive={true} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MuscleGroupRadar;

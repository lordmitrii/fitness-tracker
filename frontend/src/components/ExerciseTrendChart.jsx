import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

const ExerciseTrendChart = ({ data = [], unitSystem = "metric", t }) => {
  const fmtUnit =
    unitSystem === "metric"
      ? t?.("measurements.weight.kg")
      : t?.("measurements.weight.lbs_of");

  return (
    <div className="h-64 sm:h-72 bg-white">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid  strokeDasharray="3 3" />
          <XAxis
            dataKey="session"
            tick={{
              fontSize: 12,
              fill: "var(--color-gray-900)",
              fontWeight: 500,
            }}
            tickMargin={8}
            axisLine={{ stroke: "var(--color-black)" }}
            tickLine={{ stroke: "var(--color-black)" }}
          />
          <YAxis
            tick={{
              fontSize: 12,
              fill: "var(--color-gray-900)",
              fontWeight: 500,
            }}
            axisLine={{ stroke: "var(--color-black)" }}
            tickLine={{ stroke: "var(--color-black)" }}
            tickFormatter={(v) =>
              fmtUnit ? `${Math.round(v)}\u00a0${fmtUnit}` : Math.round(v)
            }
          />
          <RechartsTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const val = payload[0]?.value;
              return (
                <div className="rounded-xl bg-white/90 p-3 text-sm text-black shadow-xl backdrop-blur">
                  <p className="font-semibold">
                    {t?.("exercise_stats.session")}: {label}
                  </p>
                  <p className="text-sm">
                    {t?.("exercise_stats.estimated_1rm")}: {val} {fmtUnit}
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="e1rm"
            stroke="var(--color-blue-400)"
            strokeWidth={3}
            dot={{
              r: 4,
              fill: "var(--color-white)",
              stroke: "var(--color-blue-400)",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              stroke: "var(--color-blue-400)",
              fill: "var(--color-white)",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExerciseTrendChart;

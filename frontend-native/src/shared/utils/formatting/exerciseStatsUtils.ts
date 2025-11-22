import {
  EXPECTED_MUSCLE_RATIOS,
  BODYWEIGHT_FACTOR,
  MAIN_MUSCLE_GROUPS,
} from "@/src/shared/config/constants/fitness";
import { toDisplayWeight } from "./numberUtils";

type UnitSystem = "metric" | "imperial";

type MainMuscleKey = (typeof MAIN_MUSCLE_GROUPS)[number]["key"];

interface MuscleGroup {
  name: string;
}

interface ExerciseRef {
  slug?: string | null;
}

export interface ExerciseStat {
  name?: string | null;
  muscle_group?: MuscleGroup | null;
  current_weight?: number | null;
  current_reps?: number | null;
  is_time_based?: boolean;
  is_bodyweight?: boolean;
  exercise?: ExerciseRef | null;
}

export interface AggregatedRow {
  group: MainMuscleKey | string;
  e1RM: number;
  scaled: number;
  exerciseSlug: string | null;
  fallbackName: string | null;
  norm: number;
}

export const e1RM = (w: number | "", r: number | ""): number => {
  if (w === "" || r === "") return 0;
  return w * (1 + r / 30);
};

const LABEL_TO_MAIN: Map<string, MainMuscleKey | string> = (() => {
  const map = new Map<string, MainMuscleKey | string>();
  for (const g of MAIN_MUSCLE_GROUPS) {
    for (const l of g.labels) map.set(l.toLowerCase(), g.key);
  }
  return map;
})();

function resolveGroupAndLabel(name?: string | null): {
  main: MainMuscleKey | string;
  label: string;
} | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const [label, main] of LABEL_TO_MAIN) {
    if (lower.includes(label)) return { main, label };
  }
  return null;
}

export function aggregateStats(
  stats: ExerciseStat[],
  unitSystem: UnitSystem = "metric"
): AggregatedRow[] {
  type GroupKey = MainMuscleKey | string;

  const byMainGroup: {
    [group in GroupKey]?: {
      best: {
        scaled: number;
        raw: number;
        exerciseSlug: string | null;
        fallbackName: string | null;
      };
      samples: number[];
    };
  } = {};

  for (const s of stats) {
    const {
      name,
      muscle_group,
      current_weight,
      current_reps,
      is_time_based,
      is_bodyweight,
      exercise,
    } = s;

    if (!muscle_group || !current_weight || !current_reps || is_time_based)
      continue;

    const resolved = resolveGroupAndLabel(muscle_group.name);
    if (!resolved) continue;

    const { main: group, label } = resolved;
    if (
      !muscle_group ||
      current_weight == null ||
      current_weight == null ||
      !current_reps ||
      is_time_based
    )
      continue;

    const displayWeight = toDisplayWeight(Number(current_weight), unitSystem);

    const est = e1RM(displayWeight, current_reps);
    const weighted = est * (is_bodyweight ? BODYWEIGHT_FACTOR : 1);
    const ratio = EXPECTED_MUSCLE_RATIOS[label] ?? 1;
    const scaled = weighted / ratio;

    if (!byMainGroup[group]) {
      byMainGroup[group] = {
        best: {
          scaled: 0,
          raw: 0,
          exerciseSlug: exercise?.slug || null,
          fallbackName: name || null,
        },
        samples: [],
      };
    }

    byMainGroup[group]!.samples.push(scaled);

    if (scaled > byMainGroup[group]!.best.scaled) {
      byMainGroup[group]!.best = {
        scaled,
        raw: est,
        exerciseSlug: exercise?.slug || null,
        fallbackName: name || null,
      };
    }
  }

  const rows = MAIN_MUSCLE_GROUPS.map(({ key }) => {
    const entry = byMainGroup[key];
    if (!entry) {
      return {
        group: key,
        e1RM: 0,
        scaled: 0,
        exerciseSlug: null,
        fallbackName: null,
      };
    }
    const scaled = Math.max(...entry.samples) || 0;
    return {
      group: key,
      e1RM: Math.round(entry.best.raw),
      scaled,
      exerciseSlug: entry.best.exerciseSlug,
      fallbackName: entry.best.fallbackName,
    };
  });

  const maxScaled = Math.max(...rows.map((d) => d.scaled), 1);

  return rows.map((d) => ({
    ...d,
    norm: Math.round((d.scaled / maxScaled) * 100),
  }));
}


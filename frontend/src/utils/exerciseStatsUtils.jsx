import { EXPECTED_MUSCLE_RATIOS, BODYWEIGHT_FACTOR, MAIN_MUSCLE_GROUPS } from "../config/constants";

const e1RM = (w, r) => w * (1 + r / 30);

const LABEL_TO_MAIN = (() => {
  const map = new Map();
  for (const g of MAIN_MUSCLE_GROUPS) {
    for (const l of g.labels) map.set(l.toLowerCase(), g.key);
  }
  return map;
})();

function resolveGroupAndLabel(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const [label, main] of LABEL_TO_MAIN) {
    if (lower.includes(label)) return { main, label };
  }
  return null;
}

function aggregateStats(stats) {
  const byMainGroup = {};

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

    const est = e1RM(current_weight, current_reps);
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

    byMainGroup[group].samples.push(scaled);

    if (scaled > byMainGroup[group].best.scaled) {
      byMainGroup[group].best = {
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

export { e1RM, aggregateStats };

const e1RM = (w, r) => w * (1 + r / 30);

const MAIN_GROUPS = [
  { key: "chest", labels: ["chest"] },
  { key: "back", labels: ["back", "traps"] },
  { key: "arms", labels: ["biceps", "triceps", "forearms"] },
  { key: "legs", labels: ["quads", "hamstrings", "glutes", "calves"] },
  { key: "core", labels: ["abs"] },
  { key: "shoulders", labels: ["shoulders"] },
];

const EXPECTED_RATIOS = {
  forearms: 0.4,
  biceps: 0.5,
  triceps: 0.6,
  shoulders: 0.7,
  abs: 0.8,
  chest: 1.0,
  back: 1.2,
  glutes: 1.0,
  hamstrings: 1.2,
  quads: 1.3,
  calves: 1.8,
};

const BODYWEIGHT_FACTOR = 0.7;

const LABEL_TO_MAIN = (() => {
  const map = new Map();
  for (const g of MAIN_GROUPS) {
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
    const ratio = EXPECTED_RATIOS[label] ?? 1;
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

  const rows = MAIN_GROUPS.map(({ key }) => {
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

export { e1RM, EXPECTED_RATIOS, MAIN_GROUPS, BODYWEIGHT_FACTOR, aggregateStats };

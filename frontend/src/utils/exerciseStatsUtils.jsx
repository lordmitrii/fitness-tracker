const e1RM = (w, r) => w * (1 + r / 30);

const MAIN_GROUPS = [
  { key: "Chest", labels: ["chest"] },
  { key: "Back", labels: ["back", "traps"] },
  { key: "Shoulders", labels: ["shoulders"] },
  { key: "Legs", labels: ["quads", "hamstrings", "glutes", "calves"] },
  { key: "Arms", labels: ["biceps", "triceps", "forearms"] },
  { key: "Core", labels: ["abs"] },
];

const EXPECTED_RATIOS = {
  Chest: 1.0,
  Back: 1.2,
  Shoulders: 0.7,
  Legs: 1.4,
  Arms: 0.6,
  Core: 0.8,
};

const BODYWEIGHT_FACTOR = 0.7;

export { e1RM, EXPECTED_RATIOS, MAIN_GROUPS, BODYWEIGHT_FACTOR };

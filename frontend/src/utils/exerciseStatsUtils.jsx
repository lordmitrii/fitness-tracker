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
  chest: 1.0,
  back: 1.2,
  shoulders: 0.7,
  legs: 1.4,
  arms: 0.6,
  core: 0.8,
};

const BODYWEIGHT_FACTOR = 0.7;

export { e1RM, EXPECTED_RATIOS, MAIN_GROUPS, BODYWEIGHT_FACTOR };

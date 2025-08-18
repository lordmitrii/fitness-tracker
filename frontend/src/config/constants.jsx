const EXPECTED_MUSCLE_RATIOS = {
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

const STRENGTH_TOLERANCE = 0.02; // 2%
const VOLUME_TOLERANCE = 0.05; // 5%

const MAIN_MUSCLE_GROUPS = [
  { key: "chest", labels: ["chest"] },
  { key: "back", labels: ["back", "traps"] },
  { key: "arms", labels: ["biceps", "triceps", "forearms"] },
  { key: "legs", labels: ["quads", "hamstrings", "glutes", "calves"] },
  { key: "core", labels: ["abs"] },
  { key: "shoulders", labels: ["shoulders"] },
];

const PROFILE_LIMITS = {
  age: { min: 16, max: 123 },
  weight_kg: { min: 30, max: 400 },
  height_cm: { min: 120, max: 250 },
};

const MAX_SET_QT = 20;

const SET_LIMITS = {
  reps: { min: 1, max: 2000 },
  weight: { min: 0, max: 2000 },
};

export {
  EXPECTED_MUSCLE_RATIOS,
  BODYWEIGHT_FACTOR,
  MAIN_MUSCLE_GROUPS,
  STRENGTH_TOLERANCE,
  VOLUME_TOLERANCE,
  PROFILE_LIMITS,
  MAX_SET_QT,
  SET_LIMITS,
};

export const QK = {
  currentCycle: ["currentCycle"],
  plans: ["workoutPlans"],
  cycle: (planID, cycleID) => [
    "workoutCycle",
    asKeyId(planID),
    asKeyId(cycleID), 
  ],
  exerciseStats: ["exerciseStats"],
  exerciseHistory: (exerciseId) => ["exerciseHistory", asKeyId(exerciseId)],
  profile: ["profile"],
  exercisesBundle: ["exercisesBundle"],
  settings: ["settings"],
  versions: ["versions"],
};

const asKeyId = (v) => (v == null ? v : String(v));

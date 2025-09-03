export const QK = {
  currentCycle: ["currentCycle"],
  plans: ["workoutPlans"],
  cycle: (planID, cycleID) => [
    "workoutCycle",
    asKeyId(planID),
    asKeyId(cycleID), 
  ],
  exerciseStats: ["exerciseStats"],
  profile: ["profile"],
  exercisesBundle: ["exercisesBundle"],
  settings: ["settings"],
};

const asKeyId = (v) => (v == null ? v : String(v));

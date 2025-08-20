export const QK = {
  plans: ["workoutPlans"],
  plan: (planID) => ["workoutPlan", asKeyId(planID)],
  cycle: (planID, cycleID) => [
    "workoutCycle",
    asKeyId(planID),
    asKeyId(cycleID),
  ],
  exerciseStats: ["exerciseStats"],
  profile: ["profile"],
  exercisesBundle: ["exercisesBundle"],
};

const asKeyId = (v) => (v == null ? v : String(v));

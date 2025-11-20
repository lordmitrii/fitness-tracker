export const QK = {
  currentCycle: ["currentCycle"],
  plans: ["workoutPlans"],
  cycle: (planID: any, cycleID: any) => [
    "workoutCycle",
    asKeyId(planID),
    asKeyId(cycleID),
  ],
  exerciseStats: ["exerciseStats"],
  profile: ["profile"],
  exercisesBundle: ["exercisesBundle"],
  settings: ["settings"],
  versions: ["versions"],
};

const asKeyId = (v: any) => (v == null ? v : String(v));

// tests/useCycleData.patchSetFields.test.jsx
import { renderHookWithClient } from "./utils/renderHookWithClient";
import useCycleData from "@/hooks/data/useCycleData";
import { QK } from "@/utils/queryKeys";

vi.mock("@/api");
import api from "@/api";

const PLAN_ID = "p1";
const CYCLE_ID = "c1";
const WORKOUT_ID = "w1";
const EX_ID = "ex1";
const SET_ID = "s1";

describe("patchSetFieldsUI helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("patch reps/weight for ui doesnt reset completed/skipped", async () => {
    const initial = {
      id: CYCLE_ID,
      workouts: [
        {
          id: WORKOUT_ID,
          index: 1,
          workout_exercises: [
            {
              id: EX_ID,
              index: 1,
              workout_sets: [
                {
                  id: SET_ID,
                  index: 1,
                  reps: 5,
                  weight: 40,
                  completed: true,
                  skipped: false,
                },
              ],
            },
          ],
        },
      ],
    };

    const rc = renderHookWithClient(useCycleData, {
      initialProps: { planID: PLAN_ID, cycleID: CYCLE_ID, skipQuery: true },
    });
    const client = rc.queryClient ?? rc.client;

    client.setQueryData(QK.cycle(PLAN_ID, CYCLE_ID), initial);

    rc.result.current.ui.patchSetFieldsUI({
      workoutID: WORKOUT_ID,
      exerciseID: EX_ID,
      setID: SET_ID,
      reps: 10,
      weight: 55,
    });

    const after = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
    const s =
      after.workouts[0].workout_exercises[0].workout_sets.find(
        (x) => x.id === SET_ID
      );

    expect(s.reps).toBe(10);
    expect(s.weight).toBe(55);
    expect(s.completed).toBe(true); // preserved
    expect(s.skipped).toBe(false);  // preserved
  });

  it("patch with explicit completed/skipped flags", async () => {
    const initial = {
      id: CYCLE_ID,
      workouts: [
        {
          id: WORKOUT_ID,
          index: 1,
          workout_exercises: [
            {
              id: EX_ID,
              index: 1,
              workout_sets: [
                {
                  id: SET_ID,
                  index: 1,
                  reps: 6,
                  weight: 30,
                  completed: false,
                  skipped: false,
                },
              ],
            },
          ],
        },
      ],
    };

    const rc = renderHookWithClient(useCycleData, {
      initialProps: { planID: PLAN_ID, cycleID: CYCLE_ID, skipQuery: true },
    });
    const client = rc.queryClient ?? rc.client;

    client.setQueryData(QK.cycle(PLAN_ID, CYCLE_ID), initial);

    rc.result.current.ui.patchSetFieldsUI({
      workoutID: WORKOUT_ID,
      exerciseID: EX_ID,
      setID: SET_ID,
      reps: 12,
      weight: 70,
      completed: false,
      skipped: true,
    });

    const after = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
    const s =
      after.workouts[0].workout_exercises[0].workout_sets.find(
        (x) => x.id === SET_ID
      );

    expect(s.reps).toBe(12);
    expect(s.weight).toBe(70);
    expect(s.completed).toBe(false);
    expect(s.skipped).toBe(true);
  });
});

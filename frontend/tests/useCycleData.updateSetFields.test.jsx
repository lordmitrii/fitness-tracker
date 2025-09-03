// tests/useCycleData.updateSetFields.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
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

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe("updateSetFields mutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("update set fields should update reps/weight and not reset completed/skipped by itself", async () => {
    // Initial set is completed:true, skipped:false
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
                { id: SET_ID, index: 1, reps: 5, weight: 40, completed: true, skipped: false },
              ],
            },
          ],
        },
      ],
    };

    const d = deferred();
    api.patch = vi.fn().mockReturnValue(d.promise);

    const rc = renderHookWithClient(useCycleData, {
      initialProps: { planID: PLAN_ID, cycleID: CYCLE_ID, skipQuery: true },
    });
    const client = rc.queryClient ?? rc.client;

    // Seed cache
    client.setQueryData(QK.cycle(PLAN_ID, CYCLE_ID), initial);

    // Trigger mutation with reps/weight only
    rc.result.current.mutations.updateSetFields.mutate({
      workoutID: WORKOUT_ID,
      exerciseID: EX_ID,
      setID: SET_ID,
      reps: 10,
      weight: 55,
      // no completed/skipped provided
    });

    // Optimistic update should reflect reps/weight change, preserve flags
    await waitFor(() => {
      const cycle = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
      const s = cycle.workouts[0].workout_exercises[0].workout_sets[0];
      expect(s.reps).toBe(10);
      expect(s.weight).toBe(55);
      expect(s.completed).toBe(true);  // preserved
      expect(s.skipped).toBe(false);   // preserved
    });

    // Resolve server (no further local changes expected)
    d.resolve({ data: { id: SET_ID, reps: 10, weight: 55 } });

    await waitFor(() => {
      const cycle = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
      const s = cycle.workouts[0].workout_exercises[0].workout_sets[0];
      expect(s.reps).toBe(10);
      expect(s.weight).toBe(55);
      expect(s.completed).toBe(true);
      expect(s.skipped).toBe(false);
    });

    // Optional: ensure API received only reps/weight (no flags)
    expect(api.patch).toHaveBeenCalled();
    const body = api.patch.mock.calls[0][1];
    expect(body).toMatchObject({ reps: 10, weight: 55 });
    expect(Object.prototype.hasOwnProperty.call(body, "completed")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(body, "skipped")).toBe(false);
  });

  it("respects explicit completed/skipped flags", async () => {
    // Initial flags false/false
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
                { id: SET_ID, index: 1, reps: 6, weight: 30, completed: false, skipped: false },
              ],
            },
          ],
        },
      ],
    };

    const d = deferred();
    api.patch = vi.fn().mockReturnValue(d.promise);

    const rc = renderHookWithClient(useCycleData, {
      initialProps: { planID: PLAN_ID, cycleID: CYCLE_ID, skipQuery: true },
    });
    const client = rc.queryClient ?? rc.client;

    client.setQueryData(QK.cycle(PLAN_ID, CYCLE_ID), initial);

    // Trigger mutation with explicit flags
    rc.result.current.mutations.updateSetFields.mutate({
      workoutID: WORKOUT_ID,
      exerciseID: EX_ID,
      setID: SET_ID,
      reps: 12,
      weight: 70,
      completed: true,
      skipped: false,
    });

    // Optimistic: reps/weight updated, flags overridden
    await waitFor(() => {
      const cycle = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
      const s = cycle.workouts[0].workout_exercises[0].workout_sets[0];
      expect(s.reps).toBe(12);
      expect(s.weight).toBe(70);
      expect(s.completed).toBe(true);
      expect(s.skipped).toBe(false);
    });

    d.resolve({ data: { id: SET_ID, reps: 12, weight: 70, completed: true, skipped: false } });

    await waitFor(() => {
      const cycle = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
      const s = cycle.workouts[0].workout_exercises[0].workout_sets[0];
      expect(s.reps).toBe(12);
      expect(s.weight).toBe(70);
      expect(s.completed).toBe(true);
      expect(s.skipped).toBe(false);
    });

    // API payload should include the explicit flags
    expect(api.patch).toHaveBeenCalled();
    const body = api.patch.mock.calls[0][1];
    expect(body).toMatchObject({ reps: 12, weight: 70, completed: true, skipped: false });
  });
});

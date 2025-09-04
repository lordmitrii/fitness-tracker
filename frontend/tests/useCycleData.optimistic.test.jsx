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

describe("optimistic mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggleSetCompleted updates optimistically then rolls back on error", async () => {
    // Seed state
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
              workout_sets: [{ id: SET_ID, index: 1, completed: false, skipped: false }],
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

    rc.result.current.mutations.toggleSetCompleted.mutate({
      workoutID: WORKOUT_ID,
      exerciseID: EX_ID,
      setID: SET_ID,
      completed: true,
      skipped: false,
    });

    await waitFor(() => {
      const cycle = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
      const set = cycle.workouts[0].workout_exercises[0].workout_sets[0];
      expect(set.completed).toBe(true);
      expect(set.skipped).toBe(false);
    });

    // reject server => should roll back
    d.reject(new Error("fail"));

    await waitFor(() => {
      const cycle = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
      const set = cycle.workouts[0].workout_exercises[0].workout_sets[0];
      expect(set.completed).toBe(false);
      expect(set.skipped).toBe(false);
    });
  });

  it("addSet inserts temp id then replaces with server id on success", async () => {
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
                { id: "s1", index: 1, completed: false, skipped: false },
                { id: "s2", index: 2, completed: false, skipped: false },
              ],
            },
          ],
        },
      ],
    };

    const d = deferred();
    api.post = vi.fn().mockReturnValue(d.promise);

    const rc = renderHookWithClient(useCycleData, {
      initialProps: { planID: PLAN_ID, cycleID: CYCLE_ID, skipQuery: true },
    });
    const client = rc.queryClient ?? rc.client;

    client.setQueryData(QK.cycle(PLAN_ID, CYCLE_ID), initial);

    rc.result.current.mutations.addSet.mutate({
      workoutID: WORKOUT_ID,
      exerciseID: EX_ID,
      index: 2,
      template: { reps: 8, weight: 50 },
    });

    let tempId;
    await waitFor(() => {
      const cycle = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
      const sets = cycle.workouts[0].workout_exercises[0].workout_sets;
      const temp = sets.find((s) => String(s.id).startsWith("__temp_set_"));
      expect(temp).toBeTruthy();
      expect(sets.map((s) => s.index)).toEqual([1, 2, 3]);
      tempId = temp.id;
    });

    d.resolve({
      data: {
        id: "server-new",
        index: 2,
        reps: 8,
        weight: 50,
        completed: false,
        skipped: false,
      },
    });

    await waitFor(() => {
      const cycle = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
      const sets = cycle.workouts[0].workout_exercises[0].workout_sets;

      // Temp removed, server id present, order intact
      expect(sets.some((s) => s.id === tempId)).toBe(false);
      expect(sets.some((s) => s.id === "server-new")).toBe(true);
      expect(sets.map((s) => s.index)).toEqual([1, 2, 3]);
    });
  });
});

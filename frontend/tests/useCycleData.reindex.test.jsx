// tests/useCycleData.reindex.test.jsx
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
const EX_ID_1 = "ex1";
const EX_ID_2 = "ex2";
const EX_ID_3 = "ex3";
const SET_ID_1 = "s1";
const SET_ID_2 = "s2";
const SET_ID_3 = "s3";

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe("reindexing after deletes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deleteExercise reindexes subsequent exercises", async () => {
    // ex1:1, ex2:2 (to be deleted), ex3:3 -> expect ex1:1, ex3:2
    const initial = {
      id: CYCLE_ID,
      workouts: [
        {
          id: WORKOUT_ID,
          index: 1,
          workout_exercises: [
            { id: EX_ID_1, index: 1, workout_sets: [] },
            { id: EX_ID_2, index: 2, workout_sets: [] },
            { id: EX_ID_3, index: 3, workout_sets: [] },
          ],
        },
      ],
    };

    const d = deferred();
    api.delete = vi.fn().mockReturnValue(d.promise);

    const rc = renderHookWithClient(useCycleData, {
      initialProps: { planID: PLAN_ID, cycleID: CYCLE_ID, skipQuery: true },
    });
    const client = rc.queryClient ?? rc.client;

    client.setQueryData(QK.cycle(PLAN_ID, CYCLE_ID), initial);

    rc.result.current.mutations.deleteExercise.mutate({
      workoutID: WORKOUT_ID,
      exerciseID: EX_ID_2,
    });

    // Wait for optimistic update (onMutate is async)
    await waitFor(() => {
      const cycle = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
      const exs = cycle.workouts[0].workout_exercises;
      // ex2 removed
      expect(exs.map((e) => e.id)).toEqual([EX_ID_1, EX_ID_3]);
      // ex3 reindexed from 3 -> 2
      expect(exs.map((e) => e.index)).toEqual([1, 2]);
    });

    // Resolve server success; state should remain as optimistic
    d.resolve({ data: null });

    await waitFor(() => {
      const cycle = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
      const exs = cycle.workouts[0].workout_exercises;
      expect(exs.map((e) => e.id)).toEqual([EX_ID_1, EX_ID_3]);
      expect(exs.map((e) => e.index)).toEqual([1, 2]);
    });
  });

  it("deleteSet reindexes subsequent sets", async () => {
    // s1:1, s2:2 (to be deleted), s3:3 -> expect s1:1, s3:2
    const initial = {
      id: CYCLE_ID,
      workouts: [
        {
          id: WORKOUT_ID,
          index: 1,
          workout_exercises: [
            {
              id: EX_ID_1,
              index: 1,
              workout_sets: [
                { id: SET_ID_1, index: 1, completed: false, skipped: false },
                { id: SET_ID_2, index: 2, completed: false, skipped: false },
                { id: SET_ID_3, index: 3, completed: false, skipped: false },
              ],
            },
          ],
        },
      ],
    };

    const d = deferred();
    api.delete = vi.fn().mockReturnValue(d.promise);

    const rc = renderHookWithClient(useCycleData, {
      initialProps: { planID: PLAN_ID, cycleID: CYCLE_ID, skipQuery: true },
    });
    const client = rc.queryClient ?? rc.client;

    client.setQueryData(QK.cycle(PLAN_ID, CYCLE_ID), initial);

    rc.result.current.mutations.deleteSet.mutate({
      workoutID: WORKOUT_ID,
      exerciseID: EX_ID_1,
      setID: SET_ID_2,
    });

    // Wait for optimistic update
    await waitFor(() => {
      const cycle = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
      const sets = cycle.workouts[0].workout_exercises[0].workout_sets;
      // s2 removed
      expect(sets.map((s) => s.id)).toEqual([SET_ID_1, SET_ID_3]);
      // s3 reindexed from 3 -> 2
      expect(sets.map((s) => s.index)).toEqual([1, 2]);
    });

    // Resolve server success
    d.resolve({ data: null });

    await waitFor(() => {
      const cycle = client.getQueryData(QK.cycle(PLAN_ID, CYCLE_ID));
      const sets = cycle.workouts[0].workout_exercises[0].workout_sets;
      expect(sets.map((s) => s.id)).toEqual([SET_ID_1, SET_ID_3]);
      expect(sets.map((s) => s.index)).toEqual([1, 2]);
    });
  });
});

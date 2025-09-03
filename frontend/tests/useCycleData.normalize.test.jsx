import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithClient } from "./utils/renderHookWithClient";
import useCycleData from "@/hooks/data/useCycleData";

vi.mock("@/api");
import api from "@/api";

const PLAN_ID = "p1";
const CYCLE_ID = "c1";

const plansUrl = "/workout-plans";
const cycleUrl = `/workout-plans/${PLAN_ID}/workout-cycles/${CYCLE_ID}`;

describe("normalization & flags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sorts by index, fills arrays, recalculates flags", async () => {
    const cyclePayload = {
      id: CYCLE_ID,
      workouts: [
        {
          id: "w2",
          index: 2,
          workout_exercises: [
            {
              id: "exC",
              index: 2,
              workout_sets: [
                { id: "sC2", index: 2, completed: false, skipped: true },
                { id: "sC1", index: 1, completed: true, skipped: false },
              ],
            },
            {
              id: "exB",
              index: 1,
              workout_sets: null,
              completed: 1,
              skipped: 0,
            },
          ],
        },
        {
          id: "w1",
          index: 1,
          workout_exercises: [
            {
              id: "exA2",
              index: 2,
              workout_sets: [],
              completed: false,
              skipped: false,
            },
            {
              id: "exA1",
              index: 1,
              workout_sets: [
                { id: "sA2", index: 2, completed: false, skipped: true },
                { id: "sA1", index: 1, completed: false, skipped: true },
              ],
            },
          ],
        },
      ],
    };

    api.get = vi.fn(async (url) => {
      if (url === plansUrl) {
        return { data: [{ id: PLAN_ID, name: "Plan", active: true, current_cycle_id: CYCLE_ID }] };
      }
      if (url === cycleUrl) {
        return { data: cyclePayload };
      }
      return { data: {} };
    });

    const { result } = renderHookWithClient(useCycleData, {
      initialProps: { planID: PLAN_ID, cycleID: CYCLE_ID, skipQuery: false },
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(cycleUrl);
      expect(result.current.cycle?.workouts?.length).toBe(2);
    });

    const { workouts } = result.current.cycle;

    expect(workouts.map((w) => w.id)).toEqual(["w1", "w2"]);

    expect(workouts[0].workout_exercises.map((e) => e.id)).toEqual(["exA1", "exA2"]);
    expect(workouts[0].workout_exercises[0].workout_sets.map((s) => s.id)).toEqual(["sA1", "sA2"]);
    expect(workouts[1].workout_exercises.map((e) => e.id)).toEqual(["exB", "exC"]);
    expect(workouts[1].workout_exercises[1].workout_sets.map((s) => s.id)).toEqual(["sC1", "sC2"]);

    expect(workouts[1].workout_exercises[0].workout_sets).toEqual([]);

    const exA1 = workouts[0].workout_exercises[0]; // all skipped
    expect(exA1.completed).toBe(true);
    expect(exA1.skipped).toBe(true);

    const exA2 = workouts[0].workout_exercises[1]; // no sets
    expect(exA2.completed).toBe(false);
    expect(exA2.skipped).toBe(false);

    const exB = workouts[1].workout_exercises[0]; // no sets
    expect(exB.completed).toBe(true);
    expect(exB.skipped).toBe(false);

    const exC = workouts[1].workout_exercises[1]; // mix 
    expect(exC.completed).toBe(true);
    expect(exC.skipped).toBe(false);

    const w1 = workouts[0];
    const w2 = workouts[1];
    expect(w1.completed).toBe(false);
    expect(w1.skipped).toBe(false);
    expect(w2.completed).toBe(true);
    expect(w2.skipped).toBe(false);
  });

  it("computes totals", async () => {
    const cyclePayload = {
      id: CYCLE_ID,
      workouts: [
        {
          id: "w2",
          index: 2,
          workout_exercises: [
            {
              id: "exC",
              index: 2,
              workout_sets: [
                { id: "sC2", index: 2, completed: false, skipped: true }, // counts
                { id: "sC1", index: 1, completed: true, skipped: false }, // counts
              ],
            },
            { id: "exB", index: 1, workout_sets: [] },
          ],
        },
        {
          id: "w1",
          index: 1,
          workout_exercises: [
            { id: "exA2", index: 2, workout_sets: [] },
            {
              id: "exA1",
              index: 1,
              workout_sets: [
                { id: "sA2", index: 2, completed: false, skipped: true }, // counts
                { id: "sA1", index: 1, completed: false, skipped: true }, // counts
              ],
            },
          ],
        },
      ],
    };

    api.get = vi.fn(async (url) => {
      if (url === plansUrl) {
        return { data: [{ id: PLAN_ID, name: "Plan", active: true, current_cycle_id: CYCLE_ID }] };
      }
      if (url === cycleUrl) {
        return { data: cyclePayload };
      }
      return { data: {} };
    });

    const { result } = renderHookWithClient(useCycleData, {
      initialProps: { planID: PLAN_ID, cycleID: CYCLE_ID, skipQuery: false },
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(cycleUrl);
      expect(result.current.cycle?.workouts?.length).toBe(2);
    });

    expect(result.current.totalSets).toBe(4);
    expect(result.current.completedSets).toBe(4);
    expect(result.current.allWorkoutsCompleted).toBe(false); // w1 not completed
  });
});

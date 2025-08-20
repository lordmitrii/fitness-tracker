import { describe, it, expect, vi } from "vitest";
import { renderHookWithClient } from "./utils/renderHookWithClient";
import useWorkoutData from "@/hooks/useWorkoutData";
import { waitFor } from "@testing-library/react";

vi.mock("@/api");
import api from "@/api";

describe("normalization & flags", () => {
  it("sorts by index, fills arrays, recalculates flags", async () => {
    api.get
      .mockReset()
      .mockResolvedValueOnce({ data: { id: "p1" } }) // plan
      .mockResolvedValueOnce({
        data: {
          id: "c1",
          workouts: [
            { id: "w2", index: 2, workout_exercises: null },
            {
              id: "w1",
              index: 1,
              workout_exercises: [
                {
                  id: "e2",
                  index: 2,
                  workout_sets: [
                    { id: "s1", index: 1, completed: true },
                    { id: "s2", index: 2, skipped: true },
                  ],
                },
                { id: "e1", index: 1, workout_sets: [] },
              ],
            },
            { id: "wX" }, // no index -> Infinity -> last
          ],
        },
      });

    const { result } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: "p1", cycleID: "c1" },
    });

    await waitFor(() => expect(result.current.fetchedOnce).toBe(true));

    const ws = result.current.workouts;
    expect(ws.map((w) => w.id)).toEqual(["w1", "w2", "wX"]);

    const w1 = ws[0];
    expect(w1.workout_exercises.map((e) => e.id)).toEqual(["e1", "e2"]);

    const e1 = w1.workout_exercises[0];
    expect(e1.completed).toBe(false);
    expect(e1.skipped).toBe(false);

    const e2 = w1.workout_exercises[1];
    expect(e2.completed).toBe(true);
    expect(e2.skipped).toBe(false);

    expect(w1.completed).toBe(false);
    expect(w1.skipped).toBe(false);
  });

  it("computes totals", async () => {
    api.get
      .mockReset()
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({
        data: {
          workouts: [
            {
              id: "w1",
              index: 1,
              workout_exercises: [
                {
                  id: "e1",
                  index: 1,
                  workout_sets: [
                    { id: "s1", index: 1, completed: true },
                    { id: "s2", index: 2, skipped: true },
                    { id: "s3", index: 3, completed: false, skipped: false },
                  ],
                },
              ],
            },
          ],
        },
      });

    const { result } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: "p1", cycleID: "c1" },
    });

    await waitFor(() => expect(result.current.fetchedOnce).toBe(true));

    expect(result.current.totalSets).toBe(3);
    expect(result.current.completedSets).toBe(2);
    expect(result.current.allWorkoutsCompleted).toBe(false);
  });
});

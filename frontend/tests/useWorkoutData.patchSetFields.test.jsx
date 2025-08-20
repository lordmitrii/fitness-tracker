import { describe, it, expect, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithClient } from "./utils/renderHookWithClient";
import useWorkoutData from "@/hooks/data/useWorkoutData";

vi.mock("@/api");
import api from "@/api";

describe("patchSetFieldsUI helper", () => {
  it("patch reps/weight for ui doesnt reset completed/skipped", async () => {
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
                    {
                      id: "s1",
                      index: 1,
                      reps: 5,
                      weight: 20,
                      completed: true,
                      skipped: true,
                    },
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

    result.current.ui.patchSetFieldsUI({
      workoutID: "w1",
      exerciseID: "e1",
      setID: "s1",
      reps: 10,
      weight: 40,
    });

    await waitFor(() => {
      const set =
        result.current.cycle.workouts[0].workout_exercises[0].workout_sets[0];
      expect(set.reps).toBe(10);
      expect(set.weight).toBe(40);
      expect(set.completed).toBe(true);
      expect(set.skipped).toBe(true);
    });
  });

  it("patch with explicit completed/skipped flags", async () => {
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
                  workout_sets: [{ id: "s1", index: 1, reps: 5, weight: 20 }],
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

    result.current.ui.patchSetFieldsUI({
      workoutID: "w1",
      exerciseID: "e1",
      setID: "s1",
      reps: 12,
      weight: 55,
      completed: true,
      skipped: false,
    });

    await waitFor(() => {
      const set =
        result.current.cycle.workouts[0].workout_exercises[0].workout_sets[0];
      expect(set.reps).toBe(12);
      expect(set.weight).toBe(55);
      expect(set.completed).toBe(true);
      expect(set.skipped).toBe(false);
    });
  });
});

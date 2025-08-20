import { describe, it, expect, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithClient } from "./utils/renderHookWithClient";
import useWorkoutData from "@/hooks/useWorkoutData";

vi.mock("@/api");
import api from "@/api";

describe("optimistic mutations", () => {
  it("toggleSetCompleted updates optimistically then rolls back on error", async () => {
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
                    { id: "s1", index: 1, completed: false, skipped: false },
                  ],
                },
              ],
            },
          ],
        },
      });

    api.patch.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: "p1", cycleID: "c1" },
    });

    await waitFor(() => expect(result.current.fetchedOnce).toBe(true));

    await result.current.mutations.toggleSetCompleted
      .mutateAsync({
        workoutID: "w1",
        exerciseID: "e1",
        setID: "s1",
        completed: true,
        skipped: false,
      })
      .catch(() => {});

    const set =
      result.current.cycle.workouts[0].workout_exercises[0].workout_sets[0];
    expect(set.completed).toBe(false); // rolled back
  });

  it("addSet inserts temp id then replaces with server id on success", async () => {
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
                  workout_sets: [{ id: "s1", index: 1 }],
                },
              ],
            },
          ],
        },
      });

    api.post.mockResolvedValueOnce({ data: { id: "server_set", index: 2 } });

    const { result } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: "p1", cycleID: "c1" },
    });

    await waitFor(() => expect(result.current.fetchedOnce).toBe(true));

    await result.current.mutations.addSet.mutateAsync({
      workoutID: "w1",
      exerciseID: "e1",
      index: 2,
      template: { reps: 10, weight: 50 },
    });

    await waitFor(() => {
      const sets =
        result.current.cycle.workouts[0].workout_exercises[0].workout_sets;
      expect(sets.find((s) => s.id === "server_set")).toBeTruthy();
      expect(sets.some((s) => String(s.id).startsWith("__temp_set_"))).toBe(
        false
      );
    });
  });
});

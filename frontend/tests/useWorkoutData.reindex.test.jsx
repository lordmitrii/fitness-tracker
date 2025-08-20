import { describe, it, expect, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithClient } from "./utils/renderHookWithClient";
import useWorkoutData from "@/hooks/useWorkoutData";

vi.mock("@/api");
import api from "@/api";

describe("reindexing after deletes", () => {
  it("deleteExercise reindexes subsequent exercises", async () => {
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
                { id: "e1", index: 1 },
                { id: "e2", index: 2 },
                { id: "e3", index: 3 },
              ],
            },
          ],
        },
      });

    api.delete.mockResolvedValueOnce({ data: null });

    const { result } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: "p1", cycleID: "c1" },
    });

    await waitFor(() => expect(result.current.fetchedOnce).toBe(true));

    await result.current.mutations.deleteExercise.mutateAsync({
      workoutID: "w1",
      exerciseID: "e2",
    });

    await waitFor(() => {
      const exs = result.current.cycle.workouts[0].workout_exercises;
      expect(exs.map((e) => [e.id, e.index])).toEqual([
        ["e1", 1],
        ["e3", 2],
      ]);
    });
  });

  it("deleteSet reindexes subsequent sets", async () => {
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
                    { id: "s1", index: 1 },
                    { id: "s2", index: 2 },
                    { id: "s3", index: 3 },
                  ],
                },
              ],
            },
          ],
        },
      });

    api.delete.mockResolvedValueOnce({ data: null });

    const { result } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: "p1", cycleID: "c1" },
    });

    await waitFor(() => expect(result.current.fetchedOnce).toBe(true));

    await result.current.mutations.deleteSet.mutateAsync({
      workoutID: "w1",
      exerciseID: "e1",
      setID: "s2",
    });

    await waitFor(() => {
      const sets =
        result.current.cycle.workouts[0].workout_exercises[0].workout_sets;
      expect(sets.map((s) => [s.id, s.index])).toEqual([
        ["s1", 1],
        ["s3", 2],
      ]);
    });
  });
});

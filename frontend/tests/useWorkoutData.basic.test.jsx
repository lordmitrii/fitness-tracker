import { describe, it, expect, vi } from "vitest";
import { renderHookWithClient } from "./utils/renderHookWithClient";
import useWorkoutData from "@/hooks/data/useWorkoutData";
vi.mock("@/api");
import api from "@/api";

describe("useWorkoutData – basics", () => {
  it("does not fetch when ids missing or skipQuery=true", async () => {
    api.get.mockReset();

    const { result, rerender } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: null, cycleID: null, skipQuery: false },
    });

    expect(result.current.loading).toBe(false);
    expect(api.get).not.toHaveBeenCalled();

    rerender({ planID: "p1", cycleID: "c1", skipQuery: true });
    expect(api.get).not.toHaveBeenCalled();
  });

  it("select & placeholderData return safe defaults", async () => {
    api.get
      .mockReset()
      .mockResolvedValueOnce({ data: undefined }) // plan
      .mockResolvedValueOnce({ data: undefined }); // cycle

    const { result } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: "p1", cycleID: "c1", skipQuery: false },
    });

    expect(result.current.plan).toEqual({});
    expect(result.current.cycle.workouts).toEqual([]);
    expect(result.current.error).toBeFalsy();
  });
});

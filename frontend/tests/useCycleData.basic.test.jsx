import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHookWithClient } from "./utils/renderHookWithClient";
import useCycleData from "@/hooks/data/useCycleData";

vi.mock("@/api");
import api from "@/api";

describe("useCycleData – basics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get = vi.fn();
  });

  it("does not fetch when ids missing or skipQuery=true", async () => {
    const { result, rerender } = renderHookWithClient(useCycleData, {
      initialProps: { planID: null, cycleID: null, skipQuery: false },
    });

    expect(result.current.loading).toBe(false);
    expect(api.get).not.toHaveBeenCalled();

    rerender({ planID: "p1", cycleID: "c1", skipQuery: true });
    expect(api.get).not.toHaveBeenCalled();
  });

  it("select & placeholderData return safe defaults", async () => {
    api.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: undefined });

    const { result } = renderHookWithClient(useCycleData, {
      initialProps: { planID: "p1", cycleID: "c1", skipQuery: false },
    });

    expect(result.current.plan).toEqual({});
    expect(result.current.cycle?.workouts).toEqual([]);
    expect(result.current.error).toBeFalsy();
  });
});

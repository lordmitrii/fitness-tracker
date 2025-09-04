// tests/useCycleData.deleteCycle.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHookWithClient } from "./utils/renderHookWithClient";
import useCycleData from "@/hooks/data/useCycleData";
vi.mock("@/api");
import api from "@/api";
import { QK } from "@/utils/queryKeys";

const PLAN_ID = "plan-1";
const C1 = "cycle-1";
const C2 = "cycle-2";
const C3 = "cycle-3";

describe("deleteCycle mutation (tail = current) with prefetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get = vi.fn();
  });

  it("relinks prev <-> next and keeps plan.current unchanged when deleting a MIDDLE cycle (has nextCycleID)", async () => {
    api.get.mockImplementation((url) => {
      if (url.endsWith(`/workout-cycles/${C1}`)) {
        return Promise.resolve({
          data: { id: C1, previous_cycle_id: null, next_cycle_id: C3, workouts: [] },
        });
      }
      if (url.endsWith(`/workout-cycles/${C3}`)) {
        return Promise.resolve({
          data: { id: C3, previous_cycle_id: C1, next_cycle_id: null, workouts: [] },
        });
      }
      return Promise.resolve({ data: {} });
    });
    api.delete = vi.fn().mockResolvedValue({ data: {} });

    const { result, client } = renderHookWithClient(useCycleData, {
      initialProps: { planID: PLAN_ID, cycleID: C2, skipQuery: true },
    });

    client.setQueryData(QK.plans, [
      { id: PLAN_ID, name: "P", active: true, current_cycle_id: C1, updated_at: "2025-01-01T00:00:00.000Z" },
    ]);
    client.setQueryData(QK.cycle(PLAN_ID, C1), {
      id: C1, previous_cycle_id: null, next_cycle_id: C2, workouts: [],
    });
    client.setQueryData(QK.cycle(PLAN_ID, C2), {
      id: C2, previous_cycle_id: C1, next_cycle_id: C3, workouts: [],
    });
    client.setQueryData(QK.cycle(PLAN_ID, C3), {
      id: C3, previous_cycle_id: C2, next_cycle_id: null, workouts: [],
    });

    await result.current.mutations.deleteCycle.mutateAsync({
      previousCycleID: C1,
      nextCycleID: C3,
    });

    expect(client.getQueryData(QK.cycle(PLAN_ID, C2))).toBeUndefined();

    const prev = client.getQueryData(QK.cycle(PLAN_ID, C1));
    const next = client.getQueryData(QK.cycle(PLAN_ID, C3));
    expect(prev?.next_cycle_id).toBe(C3);
    expect(next?.previous_cycle_id).toBe(C1);

    const plans = client.getQueryData(QK.plans);
    expect(plans[0].current_cycle_id).toBe(C1);

    expect(api.get).toHaveBeenCalledWith(`/workout-plans/${PLAN_ID}/workout-cycles/${C1}`);
    expect(api.get).toHaveBeenCalledWith(`/workout-plans/${PLAN_ID}/workout-cycles/${C3}`);
  });

  it("clears prev.next and moves plan.current to prev when deleting the TAIL cycle (no nextCycleID)", async () => {
    api.get.mockImplementation((url) => {
      if (url.endsWith(`/workout-cycles/${C2}`)) {
        return Promise.resolve({
          data: { id: C2, previous_cycle_id: C1, next_cycle_id: null, workouts: [] },
        });
      }
      return Promise.resolve({ data: {} });
    });
    api.delete = vi.fn().mockResolvedValue({ data: {} });

    const { result, client } = renderHookWithClient(useCycleData, {
      initialProps: { planID: PLAN_ID, cycleID: C3, skipQuery: true },
    });

    client.setQueryData(QK.plans, [
      { id: PLAN_ID, name: "P", active: true, current_cycle_id: C3, updated_at: "2025-01-01T00:00:00.000Z" },
    ]);
    client.setQueryData(QK.cycle(PLAN_ID, C1), {
      id: C1, previous_cycle_id: null, next_cycle_id: C2, workouts: [],
    });
    client.setQueryData(QK.cycle(PLAN_ID, C2), {
      id: C2, previous_cycle_id: C1, next_cycle_id: C3, workouts: [],
    });
    client.setQueryData(QK.cycle(PLAN_ID, C3), {
      id: C3, previous_cycle_id: C2, next_cycle_id: null, workouts: [],
    });

    await result.current.mutations.deleteCycle.mutateAsync({
      previousCycleID: C2,
      nextCycleID: null, // tail deletion
    });

    expect(client.getQueryData(QK.cycle(PLAN_ID, C3))).toBeUndefined();

    const prev = client.getQueryData(QK.cycle(PLAN_ID, C2));
    expect(prev?.next_cycle_id).toBe(null);

    const plans = client.getQueryData(QK.plans);
    expect(plans[0].current_cycle_id).toBe(C2);

    expect(api.get).toHaveBeenCalledWith(`/workout-plans/${PLAN_ID}/workout-cycles/${C2}`);
  });

  it("rolls back neighbor relinks and plan.current if delete fails", async () => {
    api.delete = vi.fn().mockRejectedValue(new Error("boom"));
    api.get.mockResolvedValue({ data: {} });

    const { result, client } = renderHookWithClient(useCycleData, {
      initialProps: { planID: PLAN_ID, cycleID: C2, skipQuery: true },
    });

    const initialPlans = [
      { id: PLAN_ID, name: "P", active: true, current_cycle_id: C1, updated_at: "2025-01-01T00:00:00.000Z" },
    ];
    const initialC1 = { id: C1, previous_cycle_id: null, next_cycle_id: C2, workouts: [] };
    const initialC2 = { id: C2, previous_cycle_id: C1, next_cycle_id: C3, workouts: [] };
    const initialC3 = { id: C3, previous_cycle_id: C2, next_cycle_id: null, workouts: [] };

    client.setQueryData(QK.plans, initialPlans);
    client.setQueryData(QK.cycle(PLAN_ID, C1), initialC1);
    client.setQueryData(QK.cycle(PLAN_ID, C2), initialC2);
    client.setQueryData(QK.cycle(PLAN_ID, C3), initialC3);

    await expect(
      result.current.mutations.deleteCycle.mutateAsync({
        previousCycleID: C1,
        nextCycleID: C3,
      })
    ).rejects.toThrow("boom");

    expect(client.getQueryData(QK.cycle(PLAN_ID, C2))).toEqual(initialC2);
    expect(client.getQueryData(QK.cycle(PLAN_ID, C1))).toEqual(initialC1);
    expect(client.getQueryData(QK.cycle(PLAN_ID, C3))).toEqual(initialC3);
    expect(client.getQueryData(QK.plans)).toEqual(initialPlans);
  });
});

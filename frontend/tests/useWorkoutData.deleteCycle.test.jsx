import { describe, it, expect, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithClient } from "./utils/renderHookWithClient";
import useWorkoutData from "@/hooks/data/useWorkoutData";
import { QK } from "@/utils/queryKeys";

vi.mock("@/api");
import api from "@/api";

describe("deleteCycle mutation", () => {
  it("removes current cycle and resets previous cycle flags", async () => {
    api.get
      .mockReset()
      .mockResolvedValueOnce({ data: { id: "plan1" } })
      .mockResolvedValueOnce({
        data: {
          id: "c1",
          workouts: [],
        },
      });

    api.delete.mockResolvedValueOnce({ data: { ok: true } });

    const { result, client } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: "plan1", cycleID: "c1" },
    });

    await waitFor(() => expect(result.current.fetchedOnce).toBe(true));

    client.setQueryData(QK.cycle("plan1", "c0"), {
      id: "c0",
      completed: true,
      skipped: true,
      next_cycle_id: "c1",
    });

    await result.current.mutations.deleteCycle.mutateAsync({
      previousCycleID: "c0",
    });

    expect(client.getQueryData(QK.cycle("plan1", "c1"))).toBeUndefined();

    const prev = client.getQueryData(QK.cycle("plan1", "c0"));
    expect(prev.completed).toBe(false || undefined);
    expect(prev.skipped).toBe(false || undefined);
    expect(prev.next_cycle_id).toBe(null || undefined);
  });

  it("rolls back if delete fails", async () => {
    api.get
      .mockReset()
      .mockResolvedValueOnce({ data: { id: "plan1" } })
      .mockResolvedValueOnce({ data: { id: "c1", workouts: [] } });

    api.delete.mockRejectedValueOnce(new Error("fail"));

    const { result, client } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: "plan1", cycleID: "c1" },
    });

    await waitFor(() => expect(result.current.fetchedOnce).toBe(true));

    client.setQueryData(QK.cycle("plan1", "c0"), {
      id: "c0",
      completed: true,
      skipped: true,
      next_cycle_id: "c1",
    });
    client.setQueryData(QK.cycle("plan1", "c1"), {
      id: "c1",
      workouts: [],
    });

    await result.current.mutations.deleteCycle
      .mutateAsync({
        previousCycleID: "c0",
      })
      .catch(() => {});

    await waitFor(() => {
      const c1 = client.getQueryData(QK.cycle("plan1", "c1"));
      const c0 = client.getQueryData(QK.cycle("plan1", "c0"));
      expect(c1).toBeTruthy();
      expect(c0.completed).toBe(true);
      expect(c0.skipped).toBe(true);
      expect(c0.next_cycle_id).toBe("c1");
    });
  });
});

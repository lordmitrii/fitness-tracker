import { describe, it, expect, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithClient } from "./utils/renderHookWithClient";
import useWorkoutData from "@/hooks/data/useWorkoutData";
import { QK } from "@/utils/queryKeys";

vi.mock("@/api");
import api from "@/api";

describe("deleteCycle mutation (tail = current) with prefetch", () => {
  it("relinks prev <-> next and keeps plan.current unchanged when deleting a MIDDLE cycle (has nextCycleID)", async () => {
    api.get
      .mockReset()
      .mockResolvedValueOnce({ data: { id: "plan1", current_cycle_id: "c2" } }) // plan
      .mockResolvedValueOnce({ data: { id: "c1", workouts: [] } }) // cycle to delete
      .mockResolvedValueOnce({
        data: {
          id: "c0",
          workouts: [],
          next_cycle_id: "c2",
          previous_cycle_id: null,
        },
      }) // prefetch prev
      .mockResolvedValueOnce({
        data: {
          id: "c2",
          workouts: [],
          previous_cycle_id: "c0",
          next_cycle_id: null,
        },
      }); // prefetch next

    api.delete.mockResolvedValueOnce({ data: { ok: true } });

    const { result, client } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: "plan1", cycleID: "c1" },
    });

    await waitFor(() => expect(result.current.fetchedOnce).toBe(true));

    client.setQueryData(QK.cycle("plan1", "c0"), {
      id: "c0",
      completed: true,
      skipped: true,
      previous_cycle_id: null,
      next_cycle_id: "c1",
    });
    client.setQueryData(QK.cycle("plan1", "c2"), {
      id: "c2",
      completed: false,
      skipped: false,
      previous_cycle_id: "c1",
      next_cycle_id: null,
    });

    await result.current.mutations.deleteCycle.mutateAsync({
      previousCycleID: "c0",
      nextCycleID: "c2", // middle delete
    });

    await waitFor(() => {
      const c0 = client.getQueryData(QK.cycle("plan1", "c0"));
      const c2 = client.getQueryData(QK.cycle("plan1", "c2"));

      // neighbors relinked
      expect(c0?.next_cycle_id).toBe("c2");
      expect([false, undefined]).toContain(c0?.completed);
      expect([false, undefined]).toContain(c0?.skipped);
      expect(c2?.previous_cycle_id).toBe("c0");
      expect([false, undefined]).toContain(c2?.completed);
      expect([false, undefined]).toContain(c2?.skipped);

      // current stays tail (c2) because we deleted a middle cycle
      const plan = client.getQueryData(QK.plan("plan1"));
      expect(plan?.current_cycle_id).toBe("c2");
    });
  });

  it("clears prev.next and moves plan.current to prev when deleting the TAIL cycle (no nextCycleID)", async () => {
    api.get
      .mockReset()
      .mockResolvedValueOnce({ data: { id: "plan1", current_cycle_id: "c2" } }) // plan
      .mockResolvedValueOnce({ data: { id: "c2", workouts: [] } }) // tail to delete
      .mockResolvedValueOnce({
        data: {
          id: "c1",
          workouts: [],
          next_cycle_id: null,
          previous_cycle_id: "c0",
        },
      }); // prefetch prev (should come back with next cleared)

    api.delete.mockResolvedValueOnce({ data: { ok: true } });

    const { result, client } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: "plan1", cycleID: "c2" },
    });

    await waitFor(() => expect(result.current.fetchedOnce).toBe(true));

    // Seed prev so onMutate can relink/clear next optimistically
    client.setQueryData(QK.cycle("plan1", "c1"), {
      id: "c1",
      completed: true,
      skipped: true,
      previous_cycle_id: "c0",
      next_cycle_id: "c2",
    });

    await result.current.mutations.deleteCycle.mutateAsync({
      previousCycleID: "c1",
      nextCycleID: null, // tail delete
    });

    await waitFor(() => {
      const c1 = client.getQueryData(QK.cycle("plan1", "c1"));

      // prev cleared and flags reset
      expect([null, undefined]).toContain(c1?.next_cycle_id);
      expect([false, undefined]).toContain(c1?.completed);
      expect([false, undefined]).toContain(c1?.skipped);

      // plan.current moved to prev (c1)
      const plan = client.getQueryData(QK.plan("plan1"));
      expect(plan?.current_cycle_id).toBe("c1");
    });
  });

  it("rolls back neighbor relinks and plan.current if delete fails", async () => {
    api.get
      .mockReset()
      .mockResolvedValueOnce({ data: { id: "plan1", current_cycle_id: "c2" } })
      .mockResolvedValueOnce({ data: { id: "c1", workouts: [] } });

    api.delete.mockRejectedValueOnce(new Error("fail"));

    const { result, client } = renderHookWithClient(useWorkoutData, {
      initialProps: { planID: "plan1", cycleID: "c1" },
    });

    await waitFor(() => expect(result.current.fetchedOnce).toBe(true));

    // Seed caches
    client.setQueryData(QK.cycle("plan1", "c0"), {
      id: "c0",
      completed: true,
      skipped: true,
      next_cycle_id: "c1",
    });
    client.setQueryData(QK.cycle("plan1", "c1"), { id: "c1", workouts: [] });
    client.setQueryData(QK.cycle("plan1", "c2"), {
      id: "c2",
      previous_cycle_id: "c1",
      next_cycle_id: null,
    });

    await result.current.mutations.deleteCycle
      .mutateAsync({
        previousCycleID: "c0",
        nextCycleID: "c2", // middle delete
      })
      .catch(() => {});

    await waitFor(() => {
      // restored neighbors & plan
      const c1 = client.getQueryData(QK.cycle("plan1", "c1"));
      const c0 = client.getQueryData(QK.cycle("plan1", "c0"));
      const c2 = client.getQueryData(QK.cycle("plan1", "c2"));
      const plan = client.getQueryData(QK.plan("plan1"));

      expect(c1?.id).toBe("c1");
      expect(c0?.next_cycle_id).toBe("c1");
      expect(c2?.previous_cycle_id).toBe("c1");
      expect(plan?.current_cycle_id).toBe("c2"); // tail remains current
    });
  });
});

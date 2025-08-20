import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api";
import { QK } from "../../utils/queryKeys";

const fetchPlans = async () => {
  const { data } = await api.get("/workout-plans");
  return Array.isArray(data) ? data : [];
};

export default function usePlansData({ skipQuery = false } = {}) {
  const qc = useQueryClient();

  const plansQuery = useQuery({
    queryKey: QK.plans,
    queryFn: fetchPlans,
    enabled: !skipQuery,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const plans = plansQuery.data ?? [];
  const sortedPlans = useMemo(() => {
    return plans
      .slice()
      .sort((a, b) =>
        a.active !== b.active
          ? Number(b.active) - Number(a.active)
          : new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
      );
  }, [plans]);

  // --- Helpers
  const setPlansCache = useCallback(
    (nextOrFn) => {
      qc.setQueryData(QK.plans, (old) => {
        const cur = Array.isArray(old) ? old : [];
        return typeof nextOrFn === "function" ? nextOrFn(cur) : nextOrFn;
      });
    },
    [qc]
  );

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: QK.plans }),
    [qc]
  );

  // --- Mutations

  const createPlanWithWorkouts = useMutation({
    mutationKey: ["createPlanWithWorkouts"],
    mutationFn: async ({ name, active = true, workouts = [] }) => {
      const { data: plan } = await api.post("/workout-plans", {
        name,
        active,
      });
      const planID = plan.id;
      const currentCycleID = plan.current_cycle_id;

      if (workouts.length) {
        await api.post(
          `/workout-plans/${planID}/workout-cycles/${currentCycleID}/workouts/create-multiple`,
          workouts
        );
      }
      return plan; // expect { id, name, active, current_cycle_id, ... }
    },
    onSuccess: (plan) => {
      setPlansCache((list) => {
        const next = [plan, ...list.filter((p) => p.id !== plan.id)];
        if (plan.active) {
          return next.map((p) =>
            p.id === plan.id ? { ...p, active: true } : { ...p, active: false }
          );
        }
        return next;
      });
      qc.setQueryData(QK.plan(plan.id), plan);
    },
    onSettled: () => invalidate(),
  });

  const updatePlan = useMutation({
    mutationKey: ["updatePlan"],
    mutationFn: async ({ planID, payload }) => {
      const { data } = await api.patch(`/workout-plans/${planID}`, payload);
      return data ?? {};
    },
    onMutate: async ({ planID, payload }) => {
      await qc.cancelQueries({ queryKey: QK.plans });
      const previous = qc.getQueryData(QK.plans);
      // optimistic list update
      setPlansCache((list) =>
        list.map((p) => (p.id === planID ? { ...p, ...payload } : p))
      );
      qc.setQueryData(QK.plan(planID), (old) => ({
        ...(old ?? {}),
        ...payload,
      }));
      return { previous, planID };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(QK.plans, ctx.previous);
    },
    onSuccess: (updated) => {
      qc.setQueryData(QK.plan(updated.id), (old) => ({ ...old, ...updated }));
      setPlansCache((list) =>
        list.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    },
    onSettled: () => invalidate(),
  });

  const activatePlan = useMutation({
    mutationKey: ["activatePlan"],
    mutationFn: async ({ planID }) => {
      const { data } = await api.patch(`/workout-plans/${planID}/set-active`, {
        active: true,
      });
      return data ?? { id: planID, active: true };
    },
    onMutate: async ({ planID }) => {
      await qc.cancelQueries({ queryKey: QK.plans });
      const previous = qc.getQueryData(QK.plans);
      setPlansCache((list) =>
        list.map((p) =>
          p.id === planID ? { ...p, active: true } : { ...p, active: false }
        )
      );
      qc.setQueryData(QK.plan(planID), (old) => ({
        ...(old ?? {}),
        active: true,
      }));
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(QK.plans, ctx.previous);
    },
    onSettled: () => invalidate(),
  });

  const deletePlan = useMutation({
    mutationKey: ["deletePlan"],
    mutationFn: async ({ planID }) => {
      await api.delete(`/workout-plans/${planID}`);
      return { planID };
    },
    onMutate: async ({ planID }) => {
      await qc.cancelQueries({ queryKey: QK.plans });
      const previous = qc.getQueryData(QK.plans);
      setPlansCache((list) => list.filter((p) => p.id !== planID));
      qc.removeQueries({ queryKey: QK.plan(planID), exact: true });
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(QK.plans, ctx.previous);
    },
    onSettled: () => invalidate(),
  });

  return {
    // data
    plans,
    sortedPlans,

    // status
    loading: plansQuery.isLoading,
    fetching: plansQuery.isFetching,
    fetchedOnce: plansQuery.isFetched,
    error: plansQuery.error,

    // controls
    refetch: plansQuery.refetch,
    invalidate,
    setPlansCache,

    // mutations
    mutations: {
      createPlanWithWorkouts,
      updatePlan,
      activatePlan,
      deletePlan,
    },
  };
}

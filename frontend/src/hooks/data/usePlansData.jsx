import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api";
import { QK } from "../../utils/queryKeys";

export const fetchPlans = async () => {
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
    refetchOnMount: (q) => {
      const d = q?.state?.data;
      if (!d) return false;
      if (Array.isArray(d)) return d.some((p) => p && p.__partial);
      return !!d.__partial;
    },
    select: (data) => {
      if (!data) return data;
      if (Array.isArray(data)) {
        return data.map((p) => {
          if (!p) return p;
          const { __partial, ...rest } = p;
          return rest;
        });
      }
      const { __partial, ...rest } = data;
      return rest;
    },
  });

  const plans = Array.isArray(plansQuery.data) ? plansQuery.data : [];

  const sortedPlans = useMemo(() => {
    return plans
      .slice()
      .sort((a, b) =>
        a.active !== b.active
          ? Number(b.active || 0) - Number(a.active || 0)
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
      const newId = plan.id;

      const prevList = qc.getQueryData(QK.plans);
      const prevActiveId = Array.isArray(prevList)
        ? prevList.find((p) => p.active)?.id
        : undefined;

      setPlansCache((list) => {
        const withoutDup = list.filter((p) => p.id !== newId);
        if (!plan.active) {
          return [plan, ...withoutDup];
        }
        return [
          plan,
          ...withoutDup.map((p) =>
            p.id === prevActiveId ? { ...p, active: false } : p
          ),
        ];
      });

      qc.invalidateQueries({ queryKey: QK.currentCycle });
    },
    // onSettled: () => invalidate(),
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
      return { previous, planID };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(QK.plans, ctx.previous);
    },
    onSuccess: (updated) => {
      setPlansCache((list) =>
        list.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    },
    // onSettled: () => invalidate(),
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
      const prevActiveId = Array.isArray(previous)
        ? previous.find((p) => p.active)?.id
        : undefined;

      setPlansCache((list) =>
        list.map((p) => {
          if (p.id === planID) {
            return p.active ? p : { ...p, active: true };
          }
          if (p.id === prevActiveId && prevActiveId !== planID) {
            return p.active ? { ...p, active: false } : p;
          }
          return p;
        })
      );

      return { previous, prevActiveId, planID };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(QK.plans, ctx.previous);
    },
    onSuccess: (updated) => {
      setPlansCache((list) =>
        list.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );

      if (updated?.current_cycle_id && updated?.id) {
        qc.setQueryData(QK.currentCycle, {
          id: updated.current_cycle_id,
          workout_plan_id: updated.id,
        });
      }
    },

    // onSettled: () => invalidate(),
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
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(QK.plans, ctx.previous);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.currentCycle });
    },
    // onSettled: () => invalidate(),
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

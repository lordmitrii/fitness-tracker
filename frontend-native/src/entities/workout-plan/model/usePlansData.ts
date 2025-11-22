import { useCallback, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryObserverResult,
} from "@tanstack/react-query";

import api from "@/src/shared/api";
import { QK } from "@/src/shared/utils/query";
import type { WorkoutPlan } from "@/src/shared/api/Types";

export const fetchPlans = async (): Promise<WorkoutPlan[]> => {
  const { data } = await api.get("/workout-plans");
  return Array.isArray(data) ? (data as WorkoutPlan[]) : [];
};

interface UsePlansDataOptions {
  skipQuery?: boolean;
}

type PlansStateUpdater =
  | WorkoutPlan[]
  | ((current: WorkoutPlan[]) => WorkoutPlan[]);

export default function usePlansData(
  { skipQuery = false }: UsePlansDataOptions = {}
) {
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: QK.plans,
    queryFn: fetchPlans,
    enabled: !skipQuery,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previous) => previous,
    refetchOnMount: (query) => {
      const data = query?.state?.data;
      if (!data) return false;
      if (Array.isArray(data)) {
        return data.some((plan) => Boolean(plan && plan.__partial));
      }
      return Boolean((data as WorkoutPlan).__partial);
    },
    select: (raw: WorkoutPlan[] | WorkoutPlan | undefined) => {
      if (!raw) return raw;
      if (Array.isArray(raw)) {
        return raw.map((plan) => {
          if (!plan) return plan;
          const { __partial, ...rest } = plan;
          return rest;
        });
      }
      const { __partial, ...rest } = raw;
      return rest;
    },
  });

  const plans: WorkoutPlan[] = Array.isArray(plansQuery.data)
    ? plansQuery.data
    : [];

  const sortedPlans = useMemo(() => {
    return plans.slice().sort((a, b) => {
      if (a.active !== b.active) {
        return Number(Boolean(b.active)) - Number(Boolean(a.active));
      }
      const aDate = a.updated_at ? Date.parse(String(a.updated_at)) : 0;
      const bDate = b.updated_at ? Date.parse(String(b.updated_at)) : 0;
      return bDate - aDate;
    });
  }, [plans]);

  const setPlansCache = useCallback(
    (next: PlansStateUpdater) => {
      queryClient.setQueryData(QK.plans, (old: WorkoutPlan[] | undefined) => {
        const current = Array.isArray(old) ? old : [];
        return typeof next === "function"
          ? (next as (prev: WorkoutPlan[]) => WorkoutPlan[])(current)
          : next;
      });
    },
    [queryClient]
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QK.plans }).catch(() => {});
  }, [queryClient]);

  const createPlanWithWorkouts = useMutation({
    mutationKey: ["createPlanWithWorkouts"],
    mutationFn: async ({
      name,
      active = true,
      workouts = [],
    }: {
      name: string;
      active?: boolean;
      workouts?: Record<string, unknown>[];
    }) => {
      const { data: plan } = await api.post("/workout-plans", {
        name,
        active,
      });
      const planId = (plan as WorkoutPlan).id;
      const currentCycleId = (plan as WorkoutPlan).current_cycle_id;

      if (workouts.length) {
        await api.post(
          `/workout-plans/${planId}/workout-cycles/${currentCycleId}/workouts/create-multiple`,
          workouts
        );
      }

      return plan as WorkoutPlan;
    },
    onSuccess: (plan) => {
      const newId = plan.id;
      const previousList = queryClient.getQueryData<WorkoutPlan[]>(QK.plans);
      const prevActiveId = previousList?.find((p) => p.active)?.id;

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

      queryClient.invalidateQueries({ queryKey: QK.currentCycle }).catch(() => {});
    },
  });

  const updatePlan = useMutation({
    mutationKey: ["updatePlan"],
    mutationFn: async ({
      planID,
      payload,
    }: {
      planID: string | number;
      payload: Partial<WorkoutPlan>;
    }) => {
      const { data } = await api.patch(`/workout-plans/${planID}`, payload);
      return (data as WorkoutPlan) ?? {};
    },
    onMutate: async ({ planID, payload }) => {
      await queryClient.cancelQueries({ queryKey: QK.plans });
      const previous = queryClient.getQueryData<WorkoutPlan[]>(QK.plans);
      setPlansCache((list) =>
        list.map((plan) =>
          plan.id === planID ? { ...plan, ...payload } : plan
        )
      );
      return { previous };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(QK.plans, ctx.previous);
      }
    },
    onSuccess: (updated) => {
      setPlansCache((list) =>
        list.map((plan) => (plan.id === updated.id ? { ...plan, ...updated } : plan))
      );
    },
  });

  const activatePlan = useMutation({
    mutationKey: ["activatePlan"],
    mutationFn: async ({ planID }: { planID: string | number }) => {
      const { data } = await api.patch(`/workout-plans/${planID}/set-active`, {
        active: true,
      });
      return (data as WorkoutPlan) ?? { id: planID, active: true };
    },
    onMutate: async ({ planID }) => {
      await queryClient.cancelQueries({ queryKey: QK.plans });
      const previous = queryClient.getQueryData<WorkoutPlan[]>(QK.plans);
      const prevActiveId = previous?.find((plan) => plan.active)?.id;

      setPlansCache((list) =>
        list.map((plan) => {
          if (plan.id === planID) {
            return plan.active ? plan : { ...plan, active: true };
          }
          if (plan.id === prevActiveId && prevActiveId !== planID) {
            return plan.active ? { ...plan, active: false } : plan;
          }
          return plan;
        })
      );

      return { previous };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(QK.plans, ctx.previous);
      }
    },
    onSuccess: (updated) => {
      setPlansCache((list) =>
        list.map((plan) => (plan.id === updated.id ? { ...plan, ...updated } : plan))
      );

      if (updated?.current_cycle_id && updated?.id) {
        queryClient.setQueryData(QK.currentCycle, {
          id: updated.current_cycle_id,
          workout_plan_id: updated.id,
        });
      }
    },
  });

  const deletePlan = useMutation({
    mutationKey: ["deletePlan"],
    mutationFn: async ({ planID }: { planID: string | number }) => {
      await api.delete(`/workout-plans/${planID}`);
      return { planID };
    },
    onMutate: async ({ planID }) => {
      await queryClient.cancelQueries({ queryKey: QK.plans });
      const previous = queryClient.getQueryData<WorkoutPlan[]>(QK.plans);
      setPlansCache((list) => list.filter((plan) => plan.id !== planID));
      return { previous };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(QK.plans, ctx.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.currentCycle }).catch(() => {});
    },
  });

  return {
    plans,
    sortedPlans,
    loading: plansQuery.isLoading,
    fetching: plansQuery.isFetching,
    fetchedOnce: plansQuery.isFetched,
    error: plansQuery.error,
    refetch: plansQuery.refetch as () => Promise<
      QueryObserverResult<WorkoutPlan[], unknown>
    >,
    invalidate,
    setPlansCache,
    mutations: {
      createPlanWithWorkouts,
      updatePlan,
      activatePlan,
      deletePlan,
    },
  };
}


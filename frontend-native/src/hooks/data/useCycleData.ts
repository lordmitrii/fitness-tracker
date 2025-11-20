import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/src/api";
import { QK } from "@/lib/utils/queryKeys";

export async function fetchCycle(
  planID: string | number,
  cycleID: string | number
): Promise<any> {
  try {
    const res = await api.get(
      `/workout-plans/${planID}/workout-cycles/${cycleID}`
    );
    const data = res?.data ?? {};
    return {
      ...data,
      workouts: Array.isArray(data.workouts) ? data.workouts : [],
    };
  } catch (err: any) {
    throw err;
  }
}

const sortByIndex = (arr: any[] = []) =>
  arr.slice().sort((a, b) => (a.index ?? Infinity) - (b.index ?? Infinity));

function recalcExerciseFlags(ex: any) {
  const sets = ex.workout_sets ?? [];
  const hasSets = sets.length > 0;

  if (!hasSets) {
    return {
      ...ex,
      completed: !!ex.completed,
      skipped: !!ex.skipped,
    };
  }

  const allSetsSkipped = sets.every((s: any) => s.skipped === true);
  const allSetsDoneOrSkipped = sets.every(
    (s: any) => s.completed === true || s.skipped === true
  );

  return {
    ...ex,
    completed: allSetsDoneOrSkipped,
    skipped: allSetsSkipped,
  };
}

function recalcWorkoutFlags(w: any) {
  const exs = w.workout_exercises ?? [];
  const allWorkoutsSkipped =
    exs.length > 0 && exs.every((e: any) => e.skipped === true);
  const allWorkoutsDoneOrSkipped =
    exs.length > 0 &&
    exs.every((e: any) => e.completed === true || e.skipped === true);

  return {
    ...w,
    completed: allWorkoutsDoneOrSkipped,
    skipped: allWorkoutsSkipped,
  };
}

function normalizeCycleShape(cycle: any) {
  const workouts = sortByIndex(
    (cycle.workouts ?? []).map((w: any) => {
      const exs = sortByIndex(
        (w.workout_exercises ?? []).map((ex: any) => {
          const sets = sortByIndex(ex.workout_sets ?? []);
          return recalcExerciseFlags({ ...ex, workout_sets: sets });
        })
      );
      return recalcWorkoutFlags({ ...w, workout_exercises: exs });
    })
  );
  return { ...cycle, workouts };
}

function updateCycleInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  planID: string | number | undefined,
  cycleID: string | number | undefined,
  updater: any
) {
  if (!planID || !cycleID) return;
  const key = QK.cycle(planID, cycleID);
  queryClient.setQueryData(key, (old: any) => {
    const hadData = !!old;
    const cycle = old ?? { workouts: [] };
    const next =
      typeof updater === "function" ? updater(cycle) : updater ?? cycle;
    const normalized = normalizeCycleShape(next ?? cycle);
    return hadData ? normalized : { ...normalized, __partial: true };
  });
}

interface UseCycleDataOptions {
  planID?: string | number;
  cycleID?: string | number;
  skipQuery?: boolean;
}

export default function useCycleData({
  planID,
  cycleID,
  skipQuery = false,
}: UseCycleDataOptions = {}) {
  const queryClient = useQueryClient();

  const cycleQuery = useQuery({
    queryKey: QK.cycle(planID, cycleID),
    queryFn: () =>
      planID && cycleID ? fetchCycle(planID, cycleID) : Promise.resolve({}),
    enabled: !!planID && !!cycleID && !skipQuery,
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
    refetchOnMount: (query) => !!(query.state.data && query.state.data.__partial),
    select: (d: any) => {
      if (!d) return d;
      const { __partial, ...rest } = d;
      return normalizeCycleShape(rest);
    },
  });
  const cycle = cycleQuery.data ?? { workouts: [] };
  const workouts = cycle.workouts ?? [];

  const computed = useMemo(() => {
    const sets = workouts.flatMap((w: any) =>
      (w.workout_exercises || []).flatMap((ex: any) => ex.workout_sets || [])
    );
    const totalSets = sets.length;
    const completedSets = sets.filter((s: any) => s.completed || s.skipped).length;
    const allWorkoutsCompleted =
      workouts.length > 0 && workouts.every((w: any) => w.completed);
    return { totalSets, completedSets, allWorkoutsCompleted };
  }, [workouts]);

  const setCycleCache = useCallback(
    (nextOrFn: any) => {
      if (!planID || !cycleID) return;
      updateCycleInCache(queryClient, planID, cycleID, (old: any) => {
        const cur = old ?? { workouts: [] };
        return typeof nextOrFn === "function" ? nextOrFn(cur) : nextOrFn;
      });
    },
    [queryClient, planID, cycleID]
  );

  const setPlanCaches = useCallback(
    (updater: any) => {
      queryClient.setQueryData(QK.plans, (list: any) => {
        if (!Array.isArray(list)) return list;
        return list.map((p: any) =>
          String(p.id) === String(planID)
            ? typeof updater === "function"
              ? { ...updater(p), __partial: true }
              : { ...p, ...updater, __partial: true }
            : p
        );
      });
    },
    [queryClient, planID]
  );

  const invalidate = useCallback(() => {
    if (!planID || !cycleID) return Promise.resolve();
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: QK.cycle(planID, cycleID) }),
    ]);
  }, [queryClient, planID, cycleID]);

  const invalidateExerciseStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QK.exerciseStats });
  }, [queryClient]);

  const withStatsInvalidation = useCallback(
    (fn: any) =>
      (...args: any[]) => {
        try {
          fn?.(...args);
        } finally {
          invalidateExerciseStats();
        }
      },
    [invalidateExerciseStats]
  );

  const optimisticCycle = useMemo(
    () => ({
      onMutate: async (payload: any) => {
        if (!planID || !cycleID) return {};
        await queryClient.cancelQueries({
          queryKey: QK.cycle(planID, cycleID),
        });
        const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));
        return { previous, payload };
      },
      onError: (_e: any, _p: any, ctx?: any) => {
        if (ctx?.previous !== undefined && planID && cycleID) {
          queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
        }
      },
    }),
    [queryClient, planID, cycleID]
  );

  const setCycleCacheSafe = useCallback(
    (updater: any) => {
      if (!planID || !cycleID) return;
      setCycleCache(updater);
    },
    [planID, cycleID, setCycleCache]
  );

  const completeCycle = useMutation({
    mutationKey: ["completeCycle", planID, cycleID],
    mutationFn: async () => {
      if (!planID || !cycleID) return {};
      const res = await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/update-complete`,
        { completed: true }
      );
      return res?.data ?? {};
    },
    ...optimisticCycle,
    onMutate: async () => {
      const ctx = await optimisticCycle.onMutate?.({});
      setCycleCacheSafe((old: any) => ({ ...(old ?? {}), completed: true }));
      return ctx;
    },
    onSuccess: (server: any) => {
      setCycleCacheSafe((old: any) => ({
        ...old,
        completed: true,
        ...(server?.next_cycle_id !== undefined
          ? { next_cycle_id: server.next_cycle_id }
          : {}),
      }));

      if (server?.next_cycle_id !== undefined) {
        setPlanCaches({ current_cycle_id: server.next_cycle_id });
      }

      queryClient.invalidateQueries({ queryKey: QK.currentCycle });
    },
  });

  const updateSetFields = useMutation({
    mutationKey: ["updateSetFields", planID, cycleID],
    mutationFn: async (vars: any) => {
      if (!planID || !cycleID) return null;
      const {
        workoutID,
        exerciseID,
        setID,
        reps,
        weight,
        completed,
        skipped,
      } = vars;
      const payload: any = { reps, weight };
      if (completed !== undefined) payload.completed = completed;
      if (skipped !== undefined) payload.skipped = skipped;
      const res = await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}`,
        payload
      );
      return res?.data ?? null;
    },
    ...optimisticCycle,
    onMutate: async (vars: any) => {
      const ctx = await optimisticCycle.onMutate?.(vars);
      setCycleCacheSafe((cycleData: any) => ({
        ...cycleData,
        workouts: (cycleData.workouts || []).map((w: any) =>
          w.id !== vars.workoutID
            ? w
            : {
                ...w,
                workout_exercises: (w.workout_exercises || []).map((ex: any) =>
                  ex.id !== vars.exerciseID
                    ? ex
                    : {
                        ...ex,
                        workout_sets: (ex.workout_sets || []).map((s: any) =>
                          s.id !== vars.setID
                            ? s
                            : {
                                ...s,
                                reps: vars.reps,
                                weight: vars.weight,
                                completed: vars.completed ?? s.completed,
                                skipped: vars.skipped ?? s.skipped,
                              }
                        ),
                      }
                ),
              }
        ),
      }));
      return ctx;
    },
  });

  const toggleSetCompleted = useMutation({
    mutationKey: ["toggleSetCompleted", planID, cycleID],
    mutationFn: async (vars: any) => {
      if (!planID || !cycleID) return null;
      const { workoutID, exerciseID, setID, completed, skipped } = vars;
      const res = await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}/update-complete`,
        { completed, skipped }
      );
      return res?.data ?? null;
    },
    ...optimisticCycle,
    onMutate: async (vars: any) => {
      const ctx = await optimisticCycle.onMutate?.(vars);
      setCycleCacheSafe((cycleData: any) => ({
        ...cycleData,
        workouts: (cycleData.workouts || []).map((w: any) => {
          if (w.id !== vars.workoutID) return w;
          return {
            ...w,
            workout_exercises: (w.workout_exercises || []).map((ex: any) => {
              if (ex.id !== vars.exerciseID) return ex;
              return {
                ...ex,
                workout_sets: (ex.workout_sets || []).map((s: any) =>
                  s.id !== vars.setID
                    ? s
                    : { ...s, completed: vars.completed, skipped: vars.skipped }
                ),
              };
            }),
          };
        }),
      }));
      return ctx;
    },
    onSuccess: withStatsInvalidation((data: any, vars: any) => {
      if (!data || !data.estimated_calories) return;
      setCycleCacheSafe((cycleData: any) => ({
        ...cycleData,
        workouts: (cycleData.workouts || []).map((w: any) =>
          String(w.id) === String(vars.workoutID)
            ? { ...w, estimated_calories: data?.estimated_calories }
            : w
        ),
      }));
    }),
  });

  const addWorkout = useMutation({
    mutationKey: ["addWorkout", planID, cycleID],
    mutationFn: async ({ payload }: any) => {
      if (!planID || !cycleID) return null;
      const res = await api.post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts`,
        payload
      );
      return res?.data ?? null;
    },
    ...optimisticCycle,
    onMutate: async (vars: any) => {
      const ctx = await optimisticCycle.onMutate?.(vars);
      const tempId = `__temp_wk_${Date.now()}`;
      setCycleCacheSafe((cycleData: any) => ({
        ...cycleData,
        workouts: (cycleData.workouts || []).concat({
          ...vars.payload,
          id: tempId,
        }),
      }));
      return { ...ctx, tempId };
    },
    onSuccess: (server: any, _vars: any, ctx: any) => {
      if (!server?.id || !ctx?.tempId) return;
      setCycleCacheSafe((cycleData: any) => ({
        ...cycleData,
        workouts: (cycleData.workouts || []).map((w: any) =>
          w.id === ctx.tempId ? { ...w, id: server.id } : w
        ),
      }));
    },
  });

  const updateWorkout = useMutation({
    mutationKey: ["updateWorkout", planID, cycleID],
    mutationFn: async (vars: any) => {
      if (!planID || !cycleID) return null;
      const { workoutID, payload } = vars;
      const res = await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`,
        payload
      );
      return res?.data ?? null;
    },
    ...optimisticCycle,
    onMutate: async (vars: any) => {
      const ctx = await optimisticCycle.onMutate?.(vars);
      setCycleCacheSafe((old: any) => {
        const list = old?.workouts ?? [];
        const me = list.find((w: any) => String(w.id) === String(vars.workoutID));
        if (!me) return old;

        let nextWorkouts = list.map((w: any) =>
          w.id === vars.workoutID ? { ...w, ...vars.payload } : w
        );

        const hasIndex =
          vars?.payload &&
          Object.prototype.hasOwnProperty.call(vars.payload, "index");
        if (hasIndex && typeof vars.payload.index === "number") {
          const from =
            typeof me.index === "number" ? (me.index as number) : undefined;
          let to = vars.payload.index;

          if (typeof from === "number" && Number.isFinite(to) && from !== to) {
            const maxIndex = Math.max(1, nextWorkouts.length);
            to = Math.min(Math.max(1, to), maxIndex);

            nextWorkouts = nextWorkouts
              .map((w: any) => {
                if (w.id === vars.workoutID) return w;
                if (typeof w.index !== "number") return w;

                if (to < from && w.index >= to && w.index < from) {
                  return { ...w, index: w.index + 1 };
                }
                if (to > from && w.index <= to && w.index > from) {
                  return { ...w, index: w.index - 1 };
                }
                return w;
              })
              .map((w: any) => (w.id === vars.workoutID ? { ...w, index: to } : w));
          }
        }
        return { ...old, workouts: nextWorkouts, __partial: true };
      });

      return ctx;
    },
    onError: (_e: any, _vars: any, ctx: any) => {
      if (ctx?.previous !== undefined && planID && cycleID) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
    onSuccess: (server: any, vars: any) => {
      if (!server) return;
      const { workout_exercises: _ignore, ...srv } = server;

      setCycleCacheSafe((old: any) => {
        const list = old?.workouts || [];
        if (!list.some((w: any) => w.id === vars.workoutID)) return old;

        const next = list.map((w: any) =>
          w.id === vars.workoutID ? { ...w, ...srv } : w
        );
        return { ...old, workouts: next };
      });
    },
  });

  const deleteWorkout = useMutation({
    mutationKey: ["deleteWorkout", planID, cycleID],
    mutationFn: async ({ workoutID }: any) => {
      if (!planID || !cycleID) return null;
      await api.delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`
      );
      return null;
    },
    async onMutate(vars: any) {
      if (!planID || !cycleID) return {};
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));

      updateCycleInCache(queryClient, planID, cycleID, (old: any) => {
        const list = old?.workouts ?? [];
        const victim = list.find((w: any) => w.id === vars.workoutID);
        if (!victim) return old;

        const filtered = list
          .filter((w: any) => w.id !== vars.workoutID)
          .map((w: any) =>
            typeof w.index === "number" &&
            typeof victim.index === "number" &&
            w.index > victim.index
              ? { ...w, index: w.index - 1 }
              : w
          );

        return { ...old, workouts: filtered };
      });

      return { previous };
    },
    onError(_err: any, _vars: any, ctx: any) {
      if (ctx?.previous !== undefined && planID && cycleID) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
    onSuccess: withStatsInvalidation(() => {}),
  });

  const upsertExercise = useMutation({
    mutationKey: ["upsertExercise", planID, cycleID],
    mutationFn: async (vars: any) => {
      if (!planID || !cycleID) return null;
      const { workoutID, exerciseID, payload } = vars;
      if (exerciseID) {
        const res = await api.put(
          `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}`,
          payload
        );
        return res?.data ?? {};
      }
      const res = await api.post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises`,
        payload
      );
      return res?.data ?? {};
    },
    ...optimisticCycle,
    onMutate: async (vars: any) => {
      const ctx = await optimisticCycle.onMutate?.(vars);
      const tempId = `__temp_ex_${Date.now()}`;
      setCycleCacheSafe((cycleData: any) => ({
        ...cycleData,
        workouts: (cycleData.workouts || []).map((w: any) => {
          if (w.id !== vars.workoutID) return w;
          const exs = w.workout_exercises || [];
          if (vars.exerciseID) {
            return {
              ...w,
              workout_exercises: exs.map((ex: any) =>
                ex.id === vars.exerciseID ? { ...ex, ...vars.payload } : ex
              ),
            };
          }
          const nextIndex = exs.length
            ? Math.max(...exs.map((e: any) => e.index ?? 0)) + 1
            : 1;
          return {
            ...w,
            workout_exercises: [
              ...exs,
              {
                id: tempId,
                index: vars.payload?.index ?? nextIndex,
                ...vars.payload,
              },
            ],
          };
        }),
      }));
      return { ...ctx, tempId, workoutID: vars.workoutID };
    },
    onSuccess: (server: any, _vars: any, ctx: any) => {
      if (!ctx?.tempId || !ctx?.workoutID || !server?.id) return;
      setCycleCacheSafe((cycleData: any) => ({
        ...cycleData,
        workouts: (cycleData.workouts || []).map((w: any) => {
          if (w.id !== ctx.workoutID) return w;
          return {
            ...w,
            workout_exercises: (w.workout_exercises || []).map((ex: any) =>
              ex.id === ctx.tempId ? { ...server } : ex
            ),
          };
        }),
      }));
    },
  });

  const deleteCycle = useMutation({
    mutationKey: ["deleteCycle", planID, cycleID],
    mutationFn: async (vars: any) => {
      if (!planID || !cycleID) return null;
      const res = await api.delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}`
      );
      return { ...(res?.data ?? {}), ...vars };
    },
    onMutate: async (vars: any) => {
      if (!planID || !cycleID) return {};
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });

      const prevCurrent = queryClient.getQueryData(QK.cycle(planID, cycleID));
      const prevPrev = vars?.previousCycleID
        ? queryClient.getQueryData(QK.cycle(planID, vars.previousCycleID))
        : undefined;
      const prevNext = vars?.nextCycleID
        ? queryClient.getQueryData(QK.cycle(planID, vars.nextCycleID))
        : undefined;
      const prevPlans = queryClient.getQueryData(QK.plans);

      if (vars?.previousCycleID) {
        queryClient.setQueryData(
          QK.cycle(planID, vars.previousCycleID),
          (old: any) => ({
            ...(old ?? { id: vars.previousCycleID, workouts: [] }),
            next_cycle_id: vars?.nextCycleID ?? null,
            completed: false,
            skipped: false,
            __partial: true,
          })
        );
      }

      if (vars?.nextCycleID) {
        queryClient.setQueryData(QK.cycle(planID, vars.nextCycleID), (old: any) => ({
          ...(old ?? { id: vars.nextCycleID, workouts: [] }),
          previous_cycle_id: vars?.previousCycleID ?? null,
          completed: false,
          skipped: false,
          __partial: true,
        }));
      }

      const isTailDeletion = !vars?.nextCycleID;
      const preservedCurrent =
        (prevPlans as any[])?.find((p: any) => String(p.id) === String(planID))
          ?.current_cycle_id ?? null;

      setPlanCaches((p: any) => ({
        ...p,
        current_cycle_id: isTailDeletion
          ? vars?.previousCycleID ?? null
          : p.current_cycle_id ?? preservedCurrent,
        updated_at: new Date().toISOString(),
      }));

      return {
        prevCurrent,
        prevPrev,
        prevNext,
        previousCycleID: vars?.previousCycleID,
        nextCycleID: vars?.nextCycleID,
        prevPlans,
      };
    },
    onError: (_e: any, _vars: any, ctx: any) => {
      if (ctx?.prevCurrent && planID && cycleID)
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.prevCurrent);
      if (ctx?.previousCycleID && ctx?.prevPrev)
        queryClient.setQueryData(
          QK.cycle(planID, ctx.previousCycleID),
          ctx.prevPrev
        );
      if (ctx?.nextCycleID && ctx?.prevNext)
        queryClient.setQueryData(QK.cycle(planID, ctx.nextCycleID), ctx.prevNext);
      if (ctx?.prevPlans !== undefined) {
        queryClient.setQueryData(QK.plans, ctx.prevPlans);
      }
    },
    onSuccess: async (_server: any, _vars: any, ctx: any) => {
      queryClient.invalidateQueries({
        queryKey: QK.currentCycle,
        refetchType: "inactive",
      });

      if (planID && ctx?.previousCycleID) {
        await queryClient.prefetchQuery({
          queryKey: QK.cycle(planID, ctx.previousCycleID),
          queryFn: () => fetchCycle(planID, ctx.previousCycleID),
        });
      }
      if (planID && ctx?.nextCycleID) {
        await queryClient.prefetchQuery({
          queryKey: QK.cycle(planID, ctx.nextCycleID),
          queryFn: () => fetchCycle(planID, ctx.nextCycleID),
        });
      }

      if (planID && cycleID) {
        await queryClient.cancelQueries({
          queryKey: QK.cycle(planID, cycleID),
          exact: true,
        });
        queryClient.removeQueries({
          queryKey: QK.cycle(planID, cycleID),
          exact: true,
        });
      }
    },
  });

  const moveExercise = useMutation({
    mutationKey: ["moveExercise", planID, cycleID],
    mutationFn: async (vars: any) => {
      if (!planID || !cycleID) return null;
      const { workoutID, exerciseID, direction } = vars;
      const res = await api.post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/move`,
        { direction }
      );
      return res?.data ?? null;
    },
    onMutate: async (vars: any) => {
      if (!planID || !cycleID) return {};
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));

      updateCycleInCache(queryClient, planID, cycleID, (old: any) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w: any) => {
          if (w.id !== vars.workoutID) return w;
          const exs = [...(w.workout_exercises ?? [])];
          const me = exs.find((e: any) => e.id === vars.exerciseID);
          if (!me) return w;

          const targetIndex =
            vars.direction === "up" ? me.index - 1 : me.index + 1;
          const swap = exs.find((e: any) => e.index === targetIndex);
          if (!swap) return w;

          return {
            ...w,
            workout_exercises: exs.map((e: any) =>
              e.id === me.id
                ? { ...e, index: targetIndex }
                : e.id === swap.id
                ? { ...e, index: me.index }
                : e
            ),
          };
        });
        return next;
      });

      return { previous };
    },
    onError: (_e: any, _vars: any, ctx: any) => {
      if (ctx?.previous !== undefined && planID && cycleID) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
  });

  const skipExercise = useMutation({
    mutationKey: ["skipExercise", planID, cycleID],
    mutationFn: async (vars: any) => {
      if (!planID || !cycleID) return null;
      const { workoutID, exerciseID } = vars;
      const res = await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/update-complete`,
        { completed: false, skipped: true }
      );
      return res?.data ?? null;
    },
    onMutate: async (vars: any) => {
      if (!planID || !cycleID) return {};
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));

      updateCycleInCache(queryClient, planID, cycleID, (old: any) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w: any) => {
          if (w.id !== vars.workoutID) return w;
          return {
            ...w,
            workout_exercises: (w.workout_exercises || []).map((ex: any) => {
              if (ex.id !== vars.exerciseID) return ex;
              const sets = (ex.workout_sets ?? []).map((s: any) => {
                if (s.completed) return s;
                return {
                  ...s,
                  completed: false,
                  skipped: true,
                };
              });
              return { ...ex, workout_sets: sets };
            }),
          };
        });
        return next;
      });

      return { previous };
    },
    onError: (_e: any, _vars: any, ctx: any) => {
      if (ctx?.previous !== undefined && planID && cycleID) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
    onSuccess(data: any, vars: any) {
      if (!data || !data.estimated_calories) return;
      setCycleCacheSafe((cycleData: any) => ({
        ...cycleData,
        workouts: (cycleData.workouts || []).map((w: any) =>
          String(w.id) === String(vars.workoutID)
            ? { ...w, estimated_calories: data?.estimated_calories }
            : w
        ),
      }));
    },
  });

  const deleteExercise = useMutation({
    mutationKey: ["deleteExercise", planID, cycleID],
    mutationFn: async (vars: any) => {
      if (!planID || !cycleID) return null;
      const { workoutID, exerciseID } = vars;
      const res = await api.delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}`
      );
      return res?.data ?? null;
    },
    onMutate: async (vars: any) => {
      if (!planID || !cycleID) return {};
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));

      updateCycleInCache(queryClient, planID, cycleID, (old: any) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w: any) => {
          if (w.id !== vars.workoutID) return w;
          const exs = w.workout_exercises ?? [];
          const victim = exs.find((e: any) => e.id === vars.exerciseID);
          if (!victim) return w;
          const filtered = exs
            .filter((e: any) => e.id !== vars.exerciseID)
            .map((e: any) =>
              e.index > victim.index ? { ...e, index: e.index - 1 } : e
            );
          return {
            ...w,
            workout_exercises: filtered,
          };
        });
        return next;
      });

      return { previous };
    },
    onError: (_e: any, _vars: any, ctx: any) => {
      if (ctx?.previous !== undefined && planID && cycleID) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
    onSuccess: withStatsInvalidation((data: any, vars: any) => {
      if (!data || !data.estimated_calories) return;
      setCycleCacheSafe((cycleData: any) => ({
        ...cycleData,
        workouts: (cycleData.workouts || []).map((w: any) =>
          String(w.id) === String(vars.workoutID)
            ? { ...w, estimated_calories: data?.estimated_calories }
            : w
        ),
      }));
    }),
  });

  const moveSet = useMutation({
    mutationKey: ["moveSet", planID, cycleID],
    mutationFn: async (vars: any) => {
      if (!planID || !cycleID) return null;
      const { workoutID, exerciseID, setID, direction } = vars;
      const res = await api.post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}/move`,
        { direction }
      );
      return res?.data ?? null;
    },
    onMutate: async (vars: any) => {
      if (!planID || !cycleID) return {};
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));

      updateCycleInCache(queryClient, planID, cycleID, (old: any) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w: any) => {
          if (w.id !== vars.workoutID) return w;
          const exs = (w.workout_exercises ?? []).map((ex: any) => {
            if (ex.id !== vars.exerciseID) return ex;
            const sets = [...(ex.workout_sets ?? [])];
            const me = sets.find((s: any) => s.id === vars.setID);
            if (!me) return ex;

            const targetIdx =
              vars.direction === "up" ? me.index - 1 : me.index + 1;
            const swap = sets.find((s: any) => s.index === targetIdx);
            if (!swap) return ex;

            return {
              ...ex,
              workout_sets: sets.map((s: any) =>
                s.id === me.id
                  ? { ...s, index: targetIdx }
                  : s.id === swap.id
                  ? { ...s, index: me.index }
                  : s
              ),
            };
          });
          return { ...w, workout_exercises: exs };
        });
        return next;
      });

      return { previous };
    },
    onError: (_e: any, _vars: any, ctx: any) => {
      if (ctx?.previous !== undefined && planID && cycleID) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
  });

  const addSet = useMutation({
    mutationKey: ["addSet", planID, cycleID],
    mutationFn: async (vars: any) => {
      if (!planID || !cycleID) return null;
      const { workoutID, exerciseID, index, template } = vars;
      const res = await api.post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets`,
        {
          workout_exercise_id: exerciseID,
          index,
          reps: template?.reps,
          weight: template?.weight,
          previous_weight: template?.previous_weight,
          previous_reps: template?.previous_reps,
        }
      );
      return res?.data ?? null;
    },
    onMutate: async (vars: any) => {
      if (!planID || !cycleID) return {};
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));
      const tempId = `__temp_set_${Date.now()}`;

      updateCycleInCache(queryClient, planID, cycleID, (old: any) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w: any) => {
          if (w.id !== vars.workoutID) return w;
          const exs = (w.workout_exercises ?? []).map((ex: any) => {
            if (ex.id !== vars.exerciseID) return ex;
            const sets = ex.workout_sets ?? [];
            return {
              ...ex,
              workout_sets: [
                ...sets
                  .map((s: any) =>
                    s.index >= vars.index ? { ...s, index: s.index + 1 } : s
                  )
                  .filter(Boolean),
                {
                  id: tempId,
                  index: vars.index,
                  reps: vars.template?.reps ?? null,
                  weight: vars.template?.weight ?? null,
                  previous_weight: vars.template?.previous_weight ?? null,
                  previous_reps: vars.template?.previous_reps ?? null,
                  completed: false,
                  skipped: false,
                },
              ].sort((a: any, b: any) => a.index - b.index),
            };
          });
          return { ...w, workout_exercises: exs };
        });
        return next;
      });

      return {
        previous,
        tempId,
        index: vars.index,
        workoutID: vars.workoutID,
        exerciseID: vars.exerciseID,
      };
    },
    onSuccess: (server: any, _vars: any, ctx: any) => {
      updateCycleInCache(queryClient, planID, cycleID, (old: any) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w: any) => {
          if (w.id !== ctx.workoutID) return w;
          const exs = (w.workout_exercises ?? []).map((ex: any) => {
            if (ex.id !== ctx.exerciseID) return ex;
            const sets = (ex.workout_sets ?? []).map((s: any) =>
              s.id === ctx.tempId ? { ...server, index: ctx.index } : s
            );
            return { ...ex, workout_sets: sets };
          });
          return { ...w, workout_exercises: exs };
        });
        return next;
      });
    },
    onError: (_e: any, _vars: any, ctx: any) => {
      if (ctx?.previous !== undefined && planID && cycleID) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
  });

  const skipSet = useMutation({
    mutationKey: ["skipSet", planID, cycleID],
    mutationFn: async (vars: any) => {
      if (!planID || !cycleID) return null;
      const { workoutID, exerciseID, setID } = vars;
      const res = await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}/update-complete`,
        { skipped: true, completed: false }
      );
      return res?.data ?? null;
    },
    onMutate: async (vars: any) => {
      if (!planID || !cycleID) return {};
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));
      updateCycleInCache(queryClient, planID, cycleID, (old: any) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w: any) => {
          if (w.id !== vars.workoutID) return w;
          return {
            ...w,
            workout_exercises: (w.workout_exercises ?? []).map((ex: any) => {
              if (ex.id !== vars.exerciseID) return ex;
              return {
                ...ex,
                workout_sets: (ex.workout_sets ?? []).map((s: any) =>
                  s.id === vars.setID
                    ? { ...s, skipped: true, completed: false }
                    : s
                ),
              };
            }),
          };
        });
        return next;
      });
      return { previous };
    },
    onError: (_e: any, _vars: any, ctx: any) => {
      if (ctx?.previous !== undefined && planID && cycleID) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
    onSuccess(data: any, vars: any) {
      if (!data || !data.estimated_calories) return;
      setCycleCacheSafe((cycleData: any) => ({
        ...cycleData,
        workouts: (cycleData.workouts || []).map((w: any) =>
          String(w.id) === String(vars.workoutID)
            ? { ...w, estimated_calories: data?.estimated_calories }
            : w
        ),
      }));
    },
  });

  const deleteSet = useMutation({
    mutationKey: ["deleteSet", planID, cycleID],
    mutationFn: async (vars: any) => {
      if (!planID || !cycleID) return null;
      const { workoutID, exerciseID, setID } = vars;
      const res = await api.delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}`
      );
      return res?.data ?? null;
    },
    onMutate: async (vars: any) => {
      if (!planID || !cycleID) return {};
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));
      updateCycleInCache(queryClient, planID, cycleID, (old: any) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w: any) => {
          if (w.id !== vars.workoutID) return w;
          return {
            ...w,
            workout_exercises: (w.workout_exercises ?? []).map((ex: any) => {
              if (ex.id !== vars.exerciseID) return ex;
              const me = (ex.workout_sets ?? []).find(
                (s: any) => s.id === vars.setID
              );
              if (!me) return ex;
              const filtered = (ex.workout_sets ?? [])
                .filter((s: any) => s.id !== vars.setID)
                .map((s: any) =>
                  s.index > me.index ? { ...s, index: s.index - 1 } : s
                );
              return { ...ex, workout_sets: filtered };
            }),
          };
        });
        return next;
      });

      return { previous };
    },
    onError: (_e: any, _vars: any, ctx: any) => {
      if (ctx?.previous !== undefined && planID && cycleID) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
    onSuccess: withStatsInvalidation((data: any, vars: any) => {
      if (!data || !data.estimated_calories) return;
      setCycleCacheSafe((cycleData: any) => ({
        ...cycleData,
        workouts: (cycleData.workouts || []).map((w: any) =>
          String(w.id) === String(vars.workoutID)
            ? { ...w, estimated_calories: data?.estimated_calories }
            : w
        ),
      }));
    }),
  });

  const setExercisesUI = useCallback(
    (workoutID: any, nextOrFn: any) => {
      if (!planID || !cycleID) return;
      updateCycleInCache(queryClient, planID, cycleID, (old: any) => {
        const workoutsList = (old.workouts ?? []).map((w: any) =>
          w.id !== workoutID
            ? w
            : {
                ...w,
                workout_exercises:
                  typeof nextOrFn === "function"
                    ? nextOrFn(w.workout_exercises || [])
                    : nextOrFn || [],
              }
        );
        return { ...old, workouts: workoutsList };
      });
    },
    [queryClient, planID, cycleID]
  );

  const patchSetFieldsUI = useCallback(
    ({
      workoutID,
      exerciseID,
      setID,
      reps,
      weight,
      completed,
      skipped,
    }: any) => {
      if (!planID || !cycleID) return;
      updateCycleInCache(queryClient, planID, cycleID, (old: any) => ({
        ...old,
        workouts: (old.workouts || []).map((w: any) =>
          w.id !== workoutID
            ? w
            : {
                ...w,
                workout_exercises: (w.workout_exercises || []).map((ex: any) =>
                  ex.id !== exerciseID
                    ? ex
                    : {
                        ...ex,
                        workout_sets: (ex.workout_sets || []).map((s: any) =>
                          s.id !== setID
                            ? s
                            : {
                                ...s,
                                reps,
                                weight,
                                completed: completed ?? s.completed ?? false,
                                skipped: skipped ?? s.skipped ?? false,
                              }
                        ),
                      }
                ),
              }
        ),
      }));
    },
    [queryClient, planID, cycleID]
  );

  const setSetCompletedUI = useCallback(
    ({ workoutID, exerciseID, setID, completed, skipped }: any) => {
      if (!planID || !cycleID) return;
      updateCycleInCache(queryClient, planID, cycleID, (old: any) => ({
        ...old,
        workouts: (old.workouts || []).map((w: any) =>
          w.id !== workoutID
            ? w
            : {
                ...w,
                workout_exercises: (w.workout_exercises || []).map((ex: any) =>
                  ex.id !== exerciseID
                    ? ex
                    : {
                        ...ex,
                        workout_sets: (ex.workout_sets || []).map((s: any) =>
                          s.id !== setID ? s : { ...s, completed, skipped }
                        ),
                      }
                ),
              }
        ),
      }));
    },
    [queryClient, planID, cycleID]
  );

  return useMemo(
    () => ({
      cycle,
      workouts,
      ...computed,
      loading: cycleQuery.isLoading,
      fetching: cycleQuery.isFetching,
      fetchedOnce: cycleQuery.isFetched,
      error: cycleQuery.error,
      refetchAll: async () => {
        await Promise.all([cycleQuery.refetch()]);
      },
      setCycleCache,
      invalidate,
      mutations: {
        completeCycle,
        updateSetFields,
        toggleSetCompleted,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        upsertExercise,
        deleteCycle,
        moveExercise,
        skipExercise,
        deleteExercise,
        moveSet,
        addSet,
        skipSet,
        deleteSet,
      },
      ui: {
        setExercisesUI,
        patchSetFieldsUI,
        setSetCompletedUI,
      },
    }),
    [
      cycle,
      workouts,
      computed,
      cycleQuery.isLoading,
      cycleQuery.isFetching,
      cycleQuery.isFetched,
      cycleQuery.error,
      cycleQuery.refetch,
      setCycleCache,
      invalidate,
      completeCycle,
      updateSetFields,
      toggleSetCompleted,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      deleteCycle,
      upsertExercise,
      moveExercise,
      skipExercise,
      deleteExercise,
      addSet,
      moveSet,
      deleteSet,
      skipSet,
      setSetCompletedUI,
      setExercisesUI,
      patchSetFieldsUI,
    ]
  );
}


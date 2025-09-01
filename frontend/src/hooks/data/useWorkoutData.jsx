import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import api from "../../api";
import { QK } from "../../utils/queryKeys";
import useSinglePlanData from "./useSinglePlanData";

export async function fetchCycle(planID, cycleID) {
  try {
    const res = await api.get(
      `/workout-plans/${planID}/workout-cycles/${cycleID}`
    );
    const data = res?.data ?? {};
    return {
      ...data,
      workouts: Array.isArray(data.workouts) ? data.workouts : [],
    };
  } catch (err) {
    // if (err?.response?.status === 404) {
    //   return { workouts: [] };
    // }
    throw err;
  }
}

const sortByIndex = (arr = []) =>
  arr.slice().sort((a, b) => (a.index ?? Infinity) - (b.index ?? Infinity));

function recalcExerciseFlags(ex) {
  const sets = ex.workout_sets ?? [];
  const hasSets = sets.length > 0;

  if (!hasSets) {
    return {
      ...ex,
      completed: !!ex.completed,
      skipped: !!ex.skipped,
    };
  }

  const allSetsSkipped = sets.every((s) => s.skipped === true);
  const allSetsDoneOrSkipped = sets.every(
    (s) => s.completed === true || s.skipped === true
  );

  return {
    ...ex,
    completed: allSetsDoneOrSkipped,
    skipped: allSetsSkipped,
  };
}

function recalcWorkoutFlags(w) {
  const exs = w.workout_exercises ?? [];
  const allWorkoutsSkipped =
    exs.length > 0 && exs.every((e) => e.skipped === true);
  const allWorkoutsDoneOrSkipped =
    exs.length > 0 &&
    exs.every((e) => e.completed === true || e.skipped === true);

  return {
    ...w,
    completed: allWorkoutsDoneOrSkipped,
    skipped: allWorkoutsSkipped,
  };
}

function normalizeCycleShape(cycle) {
  const workouts = sortByIndex(
    (cycle.workouts ?? []).map((w) => {
      const exs = sortByIndex(
        (w.workout_exercises ?? []).map((ex) => {
          const sets = sortByIndex(ex.workout_sets ?? []);
          return recalcExerciseFlags({ ...ex, workout_sets: sets });
        })
      );
      return recalcWorkoutFlags({ ...w, workout_exercises: exs });
    })
  );
  return { ...cycle, workouts };
}

function updateCycleInCache(queryClient, planID, cycleID, updater) {
  const key = QK.cycle(planID, cycleID);
  queryClient.setQueryData(key, (old) => {
    const cycle = old ?? { workouts: [] };
    const next =
      typeof updater === "function" ? updater(cycle) : updater ?? cycle;
    return normalizeCycleShape(next ?? cycle);
  });
}

export default function useWorkoutData({
  planID,
  cycleID,
  skipQuery = false,
} = {}) {
  const queryClient = useQueryClient();
  const planQuery = useSinglePlanData(planID, { enabled: !skipQuery });

  const cycleQuery = useQuery({
    queryKey: QK.cycle(planID, cycleID),
    queryFn: () => fetchCycle(planID, cycleID),
    enabled: !!planID && !!cycleID && !skipQuery,
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    // staleTime: 1 * 1000,
    // gcTime: 1 * 1000,
    placeholderData: (prev) => prev,
    refetchOnMount: (q) => !!(q.state.data && q.state.data.__partial),
    select: (d) => {
      if (!d) return d;
      const { __partial, ...rest } = d;
      return normalizeCycleShape(rest);
    },
  });

  const plan = planQuery.data ?? {};
  const cycle = cycleQuery.data ?? { workouts: [] };
  const workouts = cycle.workouts ?? [];

  const computed = useMemo(() => {
    const sets = workouts.flatMap((w) =>
      (w.workout_exercises || []).flatMap((ex) => ex.workout_sets || [])
    );
    const totalSets = sets.length;
    const completedSets = sets.filter((s) => s.completed || s.skipped).length;
    const allWorkoutsCompleted =
      workouts.length > 0 && workouts.every((w) => w.completed);
    return { totalSets, completedSets, allWorkoutsCompleted };
  }, [workouts]);

  const setCycleCache = useCallback(
    (nextOrFn) => {
      updateCycleInCache(queryClient, planID, cycleID, (old) => {
        const cur = old ?? { workouts: [] };
        return typeof nextOrFn === "function" ? nextOrFn(cur) : nextOrFn;
      });
    },
    [queryClient, planID, cycleID]
  );

  const setPlanCaches = useCallback(
    (updater) => {
      queryClient.setQueryData(QK.plan(planID), (old) => {
        const base = old ?? {};
        const next =
          typeof updater === "function"
            ? updater(base)
            : { ...base, ...updater };
        return { ...next, __partial: true };
      });
      queryClient.setQueryData(QK.plans, (list) => {
        if (!Array.isArray(list)) return list;
        return list.map((p) =>
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
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: QK.plan(planID) }),
      queryClient.invalidateQueries({ queryKey: QK.cycle(planID, cycleID) }),
    ]);
  }, [queryClient, planID, cycleID]);

  const invalidateExerciseStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QK.exerciseStats });
  }, [queryClient]);

  const withStatsInvalidation = useCallback(
    (fn) =>
      (...args) => {
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
      onMutate: async (payload) => {
        await queryClient.cancelQueries({
          queryKey: QK.cycle(planID, cycleID),
        });
        const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));
        return { previous, payload };
      },
      onError: (_e, _p, ctx) => {
        if (ctx?.previous !== undefined) {
          queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
        }
      },
      // no onSuccess here because each mutation will either:
      //  already have a precise optimistic update, or
      //  invalidate if it needs fresh server data
    }),
    [queryClient, planID, cycleID]
  );

  // 1) Complete cycle
  const completeCycle = useMutation({
    mutationKey: ["completeCycle", planID, cycleID],
    mutationFn: async () => {
      const res = await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/update-complete`,
        { completed: true }
      );
      return res?.data ?? {};
    },
    ...optimisticCycle,

    onMutate: async () => {
      const ctx = await optimisticCycle.onMutate();
      setCycleCache((old) => ({ ...(old ?? {}), completed: true }));
      return ctx;
    },
    onSuccess: (server) => {
      setCycleCache((old) => ({
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

  // 2) Update a set’s reps/weight
  const updateSetFields = useMutation({
    mutationKey: ["updateSetFields", planID, cycleID],
    mutationFn: async ({
      workoutID,
      exerciseID,
      setID,
      reps,
      weight,
      completed,
      skipped,
    }) => {
      const payload = { reps, weight };
      if (completed !== undefined) payload.completed = completed;
      if (skipped !== undefined) payload.skipped = skipped;
      const res = await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}`,
        payload
      );
      return res?.data ?? null;
    },
    ...optimisticCycle,

    onMutate: async (vars) => {
      const ctx = await optimisticCycle.onMutate(vars);
      setCycleCache((cycle) => ({
        ...cycle,
        workouts: (cycle.workouts || []).map((w) =>
          w.id !== vars.workoutID
            ? w
            : {
                ...w,
                workout_exercises: (w.workout_exercises || []).map((ex) =>
                  ex.id !== vars.exerciseID
                    ? ex
                    : {
                        ...ex,
                        workout_sets: (ex.workout_sets || []).map((s) =>
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

  // 3) Toggle set completed
  const toggleSetCompleted = useMutation({
    mutationKey: ["toggleSetCompleted", planID, cycleID],
    mutationFn: async ({
      workoutID,
      exerciseID,
      setID,
      completed,
      skipped,
    }) => {
      const res = await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}/update-complete`,
        { completed, skipped }
      );
      return res?.data ?? null;
    },
    ...optimisticCycle,

    onMutate: async (vars) => {
      const ctx = await optimisticCycle.onMutate(vars);
      setCycleCache((cycle) => ({
        ...cycle,
        workouts: (cycle.workouts || []).map((w) => {
          if (w.id !== vars.workoutID) return w;
          return {
            ...w,
            workout_exercises: (w.workout_exercises || []).map((ex) => {
              if (ex.id !== vars.exerciseID) return ex;
              return {
                ...ex,
                workout_sets: (ex.workout_sets || []).map((s) =>
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
    onSuccess: withStatsInvalidation(() => {}),
  });

  // 4) Update workout
  const updateWorkout = useMutation({
    mutationKey: ["updateWorkout", planID, cycleID],
    mutationFn: async ({ workoutID, payload }) => {
      const res = await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`,
        payload
      );
      return res?.data ?? null;
    },
    ...optimisticCycle,

    onMutate: async (vars) => {
      const ctx = await optimisticCycle.onMutate(vars);
      setCycleCache((old) => {
        const list = old?.workouts ?? [];
        const me = list.find((w) => String(w.id) === String(vars.workoutID));
        if (!me) return old;
        

        let nextWorkouts = list.map((w) =>
          w.id === vars.workoutID ? { ...w, ...vars.payload } : w
        );

        // handle index changes
        const hasIndex =
          vars?.payload &&
          Object.prototype.hasOwnProperty.call(vars.payload, "index");
        if (hasIndex && typeof vars.payload.index === "number") {
          const from = typeof me.index === "number" ? me.index : undefined;
          let to = vars.payload.index;

          if (typeof from === "number" && Number.isFinite(to) && from !== to) {
            const maxIndex = Math.max(1, nextWorkouts.length);
            to = Math.min(Math.max(1, to), maxIndex); // clamp

            nextWorkouts = nextWorkouts
              .map((w) => {
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
              .map((w) => (w.id === vars.workoutID ? { ...w, index: to } : w));
          }
        }
        return { ...old, workouts: nextWorkouts };
      });

      return ctx;
    },

    onError: (_e, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },

    onSuccess: (server, vars) => {
      if (!server) return;
      setCycleCache((old) => {
        const list = old?.workouts ?? [];
        if (!list.some((w) => w.id === vars.workoutID)) return old;
        const merged = list.map((w) =>
          w.id === vars.workoutID ? { ...w, ...server } : w
        );
        return { ...old, workouts: merged };
      });
    },
  });

  // 5) Delete workout
  const deleteWorkout = useMutation({
    mutationKey: ["deleteWorkout", planID, cycleID],
    mutationFn: async ({ workoutID }) => {
      await api.delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`
      );
      return null; // server payload not required
    },
    async onMutate(vars) {
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));

      updateCycleInCache(queryClient, planID, cycleID, (old) => {
        const list = old?.workouts ?? [];
        const victim = list.find((w) => w.id === vars.workoutID);
        if (!victim) return old;

        const filtered = list
          .filter((w) => w.id !== vars.workoutID)
          .map((w) =>
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
    onError(_err, _vars, ctx) {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
    onSuccess: withStatsInvalidation(() => {}),
    // onSettled: () => queryClient.invalidateQueries({ queryKey: QK.cycle(planID, cycleID) }),
  });

  // 6) Replace/add exercises (API details may differ; wire similarly)
  const upsertExercise = useMutation({
    mutationKey: ["upsertExercise", planID, cycleID],
    mutationFn: async ({
      workoutID,
      exerciseID, // pass null/undefined for create
      payload,
    }) => {
      if (exerciseID) {
        const res = await api.put(
          `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}`,
          payload
        );
        return res?.data ?? {};
      } else {
        const res = await api.post(
          `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises`,
          payload
        );
        return res?.data ?? {};
      }
    },
    ...optimisticCycle,

    onMutate: async (vars) => {
      const ctx = await optimisticCycle.onMutate(vars);
      const tempId = `__temp_ex_${Date.now()}`;
      setCycleCache((cycle) => ({
        ...cycle,
        workouts: (cycle.workouts || []).map((w) => {
          if (w.id !== vars.workoutID) return w;
          const exs = w.workout_exercises || [];
          if (vars.exerciseID) {
            // replace/update
            return {
              ...w,
              workout_exercises: exs.map((ex) =>
                ex.id === vars.exerciseID ? { ...ex, ...vars.payload } : ex
              ),
            };
          }
          // add
          const nextIndex = exs.length
            ? Math.max(...exs.map((e) => e.index ?? 0)) + 1
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
    onSuccess: (server, _vars, ctx) => {
      if (!ctx?.tempId || !ctx?.workoutID || !server?.id) return;
      setCycleCache((cycle) => ({
        ...cycle,
        workouts: (cycle.workouts || []).map((w) => {
          if (w.id !== ctx.workoutID) return w;
          return {
            ...w,
            workout_exercises: (w.workout_exercises || []).map((ex) =>
              ex.id === ctx.tempId ? { ...server } : ex
            ),
          };
        }),
      }));
    },
  });

  // 7) Delete cycle
  const deleteCycle = useMutation({
    mutationKey: ["deleteCycle", planID, cycleID],
    mutationFn: async ({ previousCycleID, nextCycleID }) => {
      const res = await api.delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}`
      );
      return { ...(res?.data ?? {}), previousCycleID, nextCycleID };
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });

      const prevCurrent = queryClient.getQueryData(QK.cycle(planID, cycleID));
      const prevPrev = vars?.previousCycleID
        ? queryClient.getQueryData(QK.cycle(planID, vars.previousCycleID))
        : undefined;
      const prevNext = vars?.nextCycleID
        ? queryClient.getQueryData(QK.cycle(planID, vars.nextCycleID))
        : undefined;

      const prevPlan = queryClient.getQueryData(QK.plan(planID));
      const prevPlans = queryClient.getQueryData(QK.plans);

      if (vars?.previousCycleID) {
        queryClient.setQueryData(
          QK.cycle(planID, vars.previousCycleID),
          (old) => ({
            ...(old ?? { id: vars.previousCycleID, workouts: [] }),
            next_cycle_id: vars?.nextCycleID ?? null,
            completed: false,
            skipped: false,
            __partial: true,
          })
        );
      }

      if (vars?.nextCycleID) {
        queryClient.setQueryData(QK.cycle(planID, vars.nextCycleID), (old) => ({
          ...(old ?? { id: vars.nextCycleID, workouts: [] }),
          previous_cycle_id: vars?.previousCycleID ?? null,
          completed: false,
          skipped: false,
          __partial: true,
        }));
      }

      const isTailDeletion = !vars?.nextCycleID;
      const preservedCurrent =
        prevPlan?.current_cycle_id ?? plan?.current_cycle_id ?? null;
      setPlanCaches((p) => ({
        ...p,
        current_cycle_id: isTailDeletion
          ? vars?.previousCycleID ?? null
          : p.current_cycle_id ?? preservedCurrent,
        updated_at: new Date().toISOString(),
      }));

      queryClient.removeQueries({
        queryKey: QK.cycle(planID, cycleID),
        exact: true,
      });

      return {
        prevCurrent,
        prevPrev,
        prevNext,
        previousCycleID: vars?.previousCycleID,
        nextCycleID: vars?.nextCycleID,
        prevPlan,
        prevPlans,
      };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prevCurrent)
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.prevCurrent);
      if (ctx?.previousCycleID && ctx?.prevPrev)
        queryClient.setQueryData(
          QK.cycle(planID, ctx.previousCycleID),
          ctx.prevPrev
        );
      if (ctx?.nextCycleID && ctx?.prevNext)
        queryClient.setQueryData(
          QK.cycle(planID, ctx.nextCycleID),
          ctx.prevNext
        );
      if (ctx?.prevPlan !== undefined) {
        queryClient.setQueryData(QK.plan(planID), ctx.prevPlan);
      }
      if (ctx?.prevPlans !== undefined) {
        queryClient.setQueryData(QK.plans, ctx.prevPlans);
      }
    },
    onSuccess: async (_server, _vars, ctx) => {
      queryClient.invalidateQueries({
        queryKey: QK.plan(planID),
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: QK.currentCycle,
        refetchType: "inactive",
      });

      if (ctx?.previousCycleID) {
        await queryClient.prefetchQuery({
          queryKey: QK.cycle(planID, ctx.previousCycleID),
          queryFn: () => fetchCycle(planID, ctx.previousCycleID),
        });
      }
      if (ctx?.nextCycleID) {
        await queryClient.prefetchQuery({
          queryKey: QK.cycle(planID, ctx.nextCycleID),
          queryFn: () => fetchCycle(planID, ctx.nextCycleID),
        });
      }
    },
  });

  // 8) Move exercise (up/down one position)
  const moveExercise = useMutation({
    mutationKey: ["moveExercise", planID, cycleID],
    mutationFn: async ({ workoutID, exerciseID, direction }) => {
      const res = await api.post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/move`,
        { direction } // "up" | "down"
      );
      return res?.data ?? null;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));

      updateCycleInCache(queryClient, planID, cycleID, (old) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w) => {
          if (w.id !== vars.workoutID) return w;
          const exs = [...(w.workout_exercises ?? [])];
          const me = exs.find((e) => e.id === vars.exerciseID);
          if (!me) return w;

          const targetIndex =
            vars.direction === "up" ? me.index - 1 : me.index + 1;
          const swap = exs.find((e) => e.index === targetIndex);
          if (!swap) return w;

          // swap indices
          return {
            ...w,
            workout_exercises: exs.map((e) =>
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
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
  });

  // 9) Skip exercise (marks all sets skipped, treat exercise as "completed via skip")
  const skipExercise = useMutation({
    mutationKey: ["skipExercise", planID, cycleID],
    mutationFn: async ({ workoutID, exerciseID }) => {
      const res = await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/update-complete`,
        { completed: false, skipped: true }
      );
      return res?.data ?? null;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));

      updateCycleInCache(queryClient, planID, cycleID, (old) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w) => {
          if (w.id !== vars.workoutID) return w;
          return {
            ...w,
            workout_exercises: (w.workout_exercises || []).map((ex) => {
              if (ex.id !== vars.exerciseID) return ex;
              const sets = (ex.workout_sets ?? []).map((s) => {
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
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
  });

  // 10) Delete exercise
  const deleteExercise = useMutation({
    mutationKey: ["deleteExercise", planID, cycleID],
    mutationFn: async ({ workoutID, exerciseID }) => {
      const res = await api.delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}`
      );
      return res?.data ?? null;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));

      updateCycleInCache(queryClient, planID, cycleID, (old) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w) => {
          if (w.id !== vars.workoutID) return w;
          const exs = w.workout_exercises ?? [];
          const victim = exs.find((e) => e.id === vars.exerciseID);
          if (!victim) return w;
          const filtered = exs
            .filter((e) => e.id !== vars.exerciseID)
            .map((e) =>
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
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
    onSuccess: withStatsInvalidation(() => {}),
  });

  // 11) Move set up/down within an exercise
  const moveSet = useMutation({
    mutationKey: ["moveSet", planID, cycleID],
    mutationFn: async ({ workoutID, exerciseID, setID, direction }) => {
      const res = await api.post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}/move`,
        { direction } // "up" | "down"
      );
      return res?.data ?? null;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));

      updateCycleInCache(queryClient, planID, cycleID, (old) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w) => {
          if (w.id !== vars.workoutID) return w;
          const exs = (w.workout_exercises ?? []).map((ex) => {
            if (ex.id !== vars.exerciseID) return ex;
            const sets = [...(ex.workout_sets ?? [])];
            const me = sets.find((s) => s.id === vars.setID);
            if (!me) return ex;

            const targetIdx =
              vars.direction === "up" ? me.index - 1 : me.index + 1;
            const swap = sets.find((s) => s.index === targetIdx);
            if (!swap) return ex;

            return {
              ...ex,
              workout_sets: sets.map((s) =>
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
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
  });

  // 12) Add a set at a specific index (above/below)
  const addSet = useMutation({
    mutationKey: ["addSet", planID, cycleID],
    mutationFn: async ({ workoutID, exerciseID, index, template }) => {
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
      return res?.data ?? null; // the new set
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));
      const tempId = `__temp_set_${Date.now()}`;

      updateCycleInCache(queryClient, planID, cycleID, (old) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w) => {
          if (w.id !== vars.workoutID) return w;
          const exs = (w.workout_exercises ?? []).map((ex) => {
            if (ex.id !== vars.exerciseID) return ex;
            const sets = ex.workout_sets ?? [];
            return {
              ...ex,
              workout_sets: [
                ...sets
                  .map((s) =>
                    s.index >= vars.index ? { ...s, index: s.index + 1 } : s
                  )
                  .filter((_) => true),
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
              ].sort((a, b) => a.index - b.index),
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
    onSuccess: (server, _vars, ctx) => {
      updateCycleInCache(queryClient, planID, cycleID, (old) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w) => {
          if (w.id !== ctx.workoutID) return w;
          const exs = (w.workout_exercises ?? []).map((ex) => {
            if (ex.id !== ctx.exerciseID) return ex;
            const sets = (ex.workout_sets ?? []).map((s) =>
              s.id === ctx.tempId ? { ...server, index: ctx.index } : s
            );
            return { ...ex, workout_sets: sets };
          });
          return { ...w, workout_exercises: exs };
        });
        return next;
      });
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
  });

  // 13) Skip a set (mark skipped:true, completed:false)
  const skipSet = useMutation({
    mutationKey: ["skipSet", planID, cycleID],
    mutationFn: async ({ workoutID, exerciseID, setID }) => {
      const res = await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}/update-complete`,
        { skipped: true, completed: false }
      );
      return res?.data ?? null;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));
      updateCycleInCache(queryClient, planID, cycleID, (old) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w) => {
          if (w.id !== vars.workoutID) return w;
          return {
            ...w,
            workout_exercises: (w.workout_exercises ?? []).map((ex) => {
              if (ex.id !== vars.exerciseID) return ex;
              return {
                ...ex,
                workout_sets: (ex.workout_sets ?? []).map((s) =>
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
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
  });

  // 14) Delete a set
  const deleteSet = useMutation({
    mutationKey: ["deleteSet", planID, cycleID],
    mutationFn: async ({ workoutID, exerciseID, setID }) => {
      const res = await api.delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}`
      );
      return res?.data ?? null;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: QK.cycle(planID, cycleID) });
      const previous = queryClient.getQueryData(QK.cycle(planID, cycleID));
      updateCycleInCache(queryClient, planID, cycleID, (old) => {
        const next = { ...(old ?? {}), workouts: [...(old?.workouts ?? [])] };
        next.workouts = next.workouts.map((w) => {
          if (w.id !== vars.workoutID) return w;
          return {
            ...w,
            workout_exercises: (w.workout_exercises ?? []).map((ex) => {
              if (ex.id !== vars.exerciseID) return ex;
              const me = (ex.workout_sets ?? []).find(
                (s) => s.id === vars.setID
              );
              if (!me) return ex;
              const filtered = (ex.workout_sets ?? [])
                .filter((s) => s.id !== vars.setID)
                .map((s) =>
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
    onSuccess: withStatsInvalidation(() => {}),
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(QK.cycle(planID, cycleID), ctx.previous);
      }
    },
  });

  // UI
  const setExercisesUI = useCallback(
    (workoutID, nextOrFn) => {
      updateCycleInCache(queryClient, planID, cycleID, (old) => {
        const workouts = (old.workouts ?? []).map((w) =>
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
        return { ...old, workouts };
      });
    },
    [queryClient, planID, cycleID]
  );

  const patchSetFieldsUI = useCallback(
    ({ workoutID, exerciseID, setID, reps, weight, completed, skipped }) => {
      updateCycleInCache(queryClient, planID, cycleID, (old) => ({
        ...old,
        workouts: (old.workouts || []).map((w) =>
          w.id !== workoutID
            ? w
            : {
                ...w,
                workout_exercises: (w.workout_exercises || []).map((ex) =>
                  ex.id !== exerciseID
                    ? ex
                    : {
                        ...ex,
                        workout_sets: (ex.workout_sets || []).map((s) =>
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
    ({ workoutID, exerciseID, setID, completed, skipped }) => {
      updateCycleInCache(queryClient, planID, cycleID, (old) => ({
        ...old,
        workouts: (old.workouts || []).map((w) =>
          w.id !== workoutID
            ? w
            : {
                ...w,
                workout_exercises: (w.workout_exercises || []).map((ex) =>
                  ex.id !== exerciseID
                    ? ex
                    : {
                        ...ex,
                        workout_sets: (ex.workout_sets || []).map((s) =>
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
      // data
      plan,
      cycle,
      workouts,
      ...computed,

      // status
      loading: planQuery.isLoading || cycleQuery.isLoading,
      fetching: planQuery.isFetching || cycleQuery.isFetching,
      fetchedOnce: planQuery.isFetched && cycleQuery.isFetched,
      error: planQuery.error || cycleQuery.error,

      // controls
      refetchAll: async () => {
        await Promise.all([planQuery.refetch(), cycleQuery.refetch()]);
      },
      setCycleCache,
      invalidate,

      // mutations
      mutations: {
        completeCycle,
        updateSetFields,
        toggleSetCompleted,
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
      // ui
      ui: {
        setExercisesUI,
        patchSetFieldsUI,
        setSetCompletedUI,
      },
    }),
    [
      plan,
      cycle,
      workouts,
      computed,
      planQuery.isLoading,
      cycleQuery.isLoading,
      planQuery.isFetching,
      cycleQuery.isFetching,
      planQuery.isFetched,
      cycleQuery.isFetched,
      planQuery.error,
      cycleQuery.error,
      planQuery.refetch,
      cycleQuery.refetch,
      setCycleCache,
      invalidate,
      completeCycle,
      updateSetFields,
      toggleSetCompleted,
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

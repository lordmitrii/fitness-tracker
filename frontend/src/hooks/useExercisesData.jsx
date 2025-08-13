import { useState, useEffect, useCallback } from "react";
import api from "../api";

function useExercisesData(open, onError) {
  const [exercises, setExercises] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  useEffect(() => {
    if (!open || fetchedOnce) return;
    const ac = new AbortController();
    setLoading(true);

    Promise.all([
      api.get("exercises/", { signal: ac.signal }),
      api.get("individual-exercises", { signal: ac.signal }),
      api.get("muscle-groups/", { signal: ac.signal }),
    ])
      .then(([res1, res2, res3]) => {
        const pool = (res1?.data ?? []).map((ex) => ({ ...ex, source: "pool" }));
        const customs = (res2?.data ?? [])
          .filter((ex) => !ex.exercise_id)
          .map((ex) => ({ ...ex, source: "custom" }));
        setExercises([...pool, ...customs]);
        setMuscleGroups(res3?.data ?? []);
        setFetchedOnce(true);
      })
      .catch((err) => {
        if (!ac.signal.aborted) {
          console.error("Error fetching exercises data:", err);
          onError?.(err)
        };
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [open, fetchedOnce, onError]);

  const resetForNextOpen = useCallback(() => {
    setFetchedOnce(false);
  }, []);

  return { exercises, muscleGroups, loading, fetchedOnce, resetForNextOpen };
}

export default useExercisesData;
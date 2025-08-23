import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { QK } from "../utils/queryKeys";
import { fetchCurrentCycle } from "../hooks/data/useCurrentCycleData";
// import { fetchPlan } from "../hooks/data/useSinglePlanData";
// import { fetchCycle } from "../hooks/data/useWorkoutData";

export default function WorkoutRedirect() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cur = await qc.ensureQueryData({
          queryKey: QK.currentCycle,
          queryFn: fetchCurrentCycle,
        });
        if (cancelled) return;

        if (cur?.workout_plan_id && cur?.id) {
          const pid = String(cur.workout_plan_id);
          const cid = String(cur.id);

          //   await Promise.all([
          //     qc.prefetchQuery({ queryKey: QK.plan(pid),  queryFn: () => fetchPlan(pid) }),
          //     qc.prefetchQuery({ queryKey: QK.cycle(pid, cid), queryFn: () => fetchCycle(pid, cid) }),
          //   ]);

          navigate(`/workout-plans/${pid}/workout-cycles/${cid}`, {
            replace: true,
          });
        } else {
          navigate("/workout-plans", { replace: true });
        }
      } catch {
        navigate("/workout-plans", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qc, navigate]);

  return null;
}

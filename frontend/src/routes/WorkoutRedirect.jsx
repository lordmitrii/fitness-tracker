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
    console.log("[redirect] mount");
    let cancelled = false;

    (async () => {
      try {
        const cur = await qc.ensureQueryData({
          queryKey: QK.currentCycle,
          queryFn: fetchCurrentCycle,
        });
        console.log("[redirect] fetched currentCycle", cur);
        if (cancelled) return;

        if (cur?.workout_plan_id && cur?.id) {
          console.log("[redirect] navigating to cycle", cur);
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
          console.log("[redirect] navigating to /workout-plans");
          navigate("/workout-plans", { replace: true });
        }
      } catch (err) {
        console.log("[redirect] fetch failed", err);
        navigate("/workout-plans", { replace: true });
      }
    })();

    return () => {
      console.log("[redirect] cleanup");
      cancelled = true;
    };
  }, [qc, navigate]);

  return null;
}

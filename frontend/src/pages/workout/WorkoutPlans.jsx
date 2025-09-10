import { useLayoutEffect, useCallback, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import DropdownMenu from "../../components/DropdownMenu";
import WorkoutPlanDetailsMenu from "../../components/workout/WorkoutPlanDetailsMenu";
import FireIcon from "../../icons/FireIcon";
import { useTranslation } from "react-i18next";
import { LayoutHeader } from "../../layout/LayoutHeader";
import usePlansData from "../../hooks/data/usePlansData";
import { usePullToRefreshOverride } from "../../context/PullToRefreshContext";
import useCurrentCycleData from "../../hooks/data/useCurrentCycleData";

const WorkoutPlans = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { currentCycle, refetch: refetchCurrentCycle } = useCurrentCycleData();

  const {
    plans,
    sortedPlans,
    loading,
    error,
    refetch,
    setPlansCache, // pass to menu to mimic old setState-based updates
  } = usePlansData();

  // To be removed, but for now its here for backward compatibility
  useLayoutEffect(() => {
    if (searchParams.get("showCurrent") === "true" && plans.length) {
      if (currentCycle) {
        navigate(
          `/workout-plans/${currentCycle.workout_plan_id}/workout-cycles/${currentCycle.id}`, { replace: true }
        );
      }
    }
  }, [searchParams, plans, navigate, currentCycle]);

  usePullToRefreshOverride(
    useCallback(async () => {
      await refetch();
      await refetchCurrentCycle();
    }, [refetch, refetchCurrentCycle])
  );

  if (loading)
    return <LoadingState message={t("workout_plans.loading_plans")} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <LayoutHeader>
        <div className="flex justify-between items-start px-4">
          <h1 className="text-title font-bold">
            {t("workout_plans.workout_plans")}
          </h1>
          {plans.length > 0 && (
            <button
              className="btn btn-primary h-fit"
              onClick={() => navigate("/create-workout-plan")}
            >
              <span className="whitespace-nowrap">+ {t("general.create")}</span>
            </button>
          )}
        </div>
      </LayoutHeader>
      <div className="p-4">
        {sortedPlans.length > 0 ? (
          <ul className="space-y-6">
            {sortedPlans.map((workoutPlan) => (
              <li
                key={workoutPlan.id}
                className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between gap-4 transition hover:shadow-lg border border-gray-200"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center justify-center gap-2 min-w-0">
                      <Link
                        className="text-body-blue font-semibold hover:underline truncate"
                        to={`/workout-plans/${workoutPlan.id}/workout-cycles/${workoutPlan.current_cycle_id}`}
                      >
                        {workoutPlan.name}
                      </Link>
                      {workoutPlan.active && (
                        <span className="flex items-center border border-green-500 text-green-400 bg-green-100 px-2 py-1 rounded-xl text-sm font-semibold ml-2 gap-2">
                          <FireIcon />
                          {t("general.active")}
                        </span>
                      )}
                    </div>
                    <DropdownMenu
                      menu={({ close }) => (
                        <WorkoutPlanDetailsMenu
                          closeMenu={close}
                          plan={workoutPlan}
                          setWorkoutPlans={setPlansCache}
                        />
                      )}
                    />
                  </div>

                  <div className="text-caption mt-1">
                    {t("general.last_updated")}{" "}
                    {workoutPlan.updated_at
                      ? new Date(workoutPlan.updated_at).toLocaleDateString(
                          i18n.language
                        )
                      : t("general.n_a")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center">
            <p className="text-body mb-6">
              {t("workout_plans.no_plans_found")}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/create-workout-plan")}
            >
              + {t("workout_plans.create_new_plan")}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default WorkoutPlans;

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import DropdownMenu from "../../components/DropdownMenu";
import WorkoutPlanDetailsMenu from "../../components/workout/WorkoutPlanDetailsMenu";
import FireIcon from "../../icons/FireIcon";
import { useTranslation } from "react-i18next";
import { LayoutHeader } from "../../layout/LayoutHeader";

const WorkoutPlans = () => {
  const [searchParams] = useSearchParams();
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    setLoading(true);
    api
      .get("/workout-plans")
      .then((response) => {
        setWorkoutPlans(response.data);
      })
      .catch((error) => {
        console.error("Error fetching workout plans:", error);
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (searchParams.get("showCurrent") === "true") {
      const activePlan = workoutPlans.find((plan) => plan.active);
      if (activePlan) {
        navigate(
          `/workout-plans/${activePlan.id}/workout-cycles/${activePlan.current_cycle_id}`
        );
      }
    }
  }, [searchParams, workoutPlans]);

  if (loading)
    return <LoadingState message={t("workout_plans.loading_plans")} />;
  if (error)
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );

  return (
    <>
      <LayoutHeader>
        <div className="flex justify-between px-4">
          <h1 className="text-title font-bold">
            {t("workout_plans.workout_plans")}
          </h1>
          {workoutPlans.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => navigate("/create-workout-plan")}
            >
              + {t("general.create")}
            </button>
          )}
        </div>
      </LayoutHeader>
      <div className="p-4">
        {workoutPlans.length > 0 ? (
          <ul className="space-y-6">
            {workoutPlans
              .slice()
              .sort((a, b) => {
                if (a.active !== b.active) return b.active - a.active;
                return new Date(b.updated_at) - new Date(a.updated_at);
              })
              .map((workoutPlan) => (
                <li
                  key={workoutPlan.id}
                  className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between gap-4 transition hover:shadow-lg border border-gray-200"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          className="text-body-blue font-semibold hover:underline"
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
                            onError={setError}
                            setWorkoutPlans={setWorkoutPlans}
                          />
                        )}
                      />
                    </div>

                    <div className="text-caption mt-1">
                      {t("general.last_updated")}{" "}
                      {new Date(workoutPlan.updated_at).toLocaleDateString(
                        i18n.language
                      )}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        ) : (
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center mt-8">
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

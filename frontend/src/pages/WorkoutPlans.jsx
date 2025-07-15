import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import DropdownMenu from "../components/DropdownMenu";
import WorkoutPlanDetailsMenu from "../components/WorkoutPlanDetailsMenu";
import FireIcon from "../icons/FireIcon";

const WorkoutPlans = () => {
  const [searchParams] = useSearchParams();
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api
      .get("/workout-plans")
      .then((response) => {
        setWorkoutPlans(response.data);
      })
      .catch((error) => {
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

  const handleActivatePlan = (planID) => {
    api
      .patch(`/workout-plans/${planID}/set-active`, { active: true })
      .then(() => {
        setWorkoutPlans((prevPlans) =>
          prevPlans.map((plan) =>
            plan.id === planID
              ? { ...plan, active: true }
              : { ...plan, active: false }
          )
        );
      })
      .catch((error) => {
        console.error("Error activating workout plan:", error);
        setError(error);
      });
  };

  if (loading) return <LoadingState message="Loading your plans..." />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
          Workout Plans
        </h1>
        {workoutPlans.length > 0 && (
          <button
            className="btn btn-primary hidden sm:inline-block"
            onClick={() => navigate("/create-workout-plan")}
          >
            + Create
          </button>
        )}
      </div>

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
                        className="text-xl font-semibold text-blue-700 hover:underline"
                        to={`/workout-plans/${workoutPlan.id}/workout-cycles/${workoutPlan.current_cycle_id}`}
                      >
                        {workoutPlan.name}
                      </Link>
                      {workoutPlan.active && (
                        <span className="flex items-center border border-green-500 text-green-600 bg-green-100 px-2 py-1 rounded-xl text-xs font-semibold ml-2 gap-2">
                          <FireIcon />
                          Active
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

                  <div className="text-sm text-gray-500 mt-1">
                    Last updated:{" "}
                    {new Date(workoutPlan.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))}
        </ul>
      ) : (
        <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center mt-8">
          <p className="text-gray-700 mb-6 text-lg">
            No workout plans found. Create your first plan!
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/create-workout-plan")}
          >
            + Create Workout Plan
          </button>
        </div>
      )}

      {/* Floating create button for mobile */}
      {workoutPlans.length > 0 && (
        <button
          className="btn btn-primary border inset-shadow-xs fixed bottom-5 right-5 z-20 sm:hidden"
          onClick={() => navigate("/create-workout-plan")}
          aria-label="Create workout plan"
        >
          + Create new plan
        </button>
      )}
    </div>
  );
};

export default WorkoutPlans;

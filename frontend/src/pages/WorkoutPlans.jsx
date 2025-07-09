import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const WorkoutPlans = () => {
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8">
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
              .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0))
              .map((workoutPlan) => (
                <li
                  key={workoutPlan.id}
                  className="bg-white rounded-2xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition hover:shadow-lg border border-gray-200"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        className="text-xl font-semibold text-blue-700 hover:underline"
                        to={`/workout-plans/${workoutPlan.id}/workout-cycles/${workoutPlan.current_cycle_id}`}
                      >
                        {workoutPlan.name}
                      </Link>
                      {workoutPlan.active && (
                        <span className="flex items-center border border-green-500 text-green-600 bg-green-100 px-2 py-1 rounded-xl text-xs font-semibold ml-2 gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"
                            />
                          </svg>
                          Active
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-500 mt-1">
                      Created:{" "}
                      {new Date(workoutPlan.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button
                      className="btn btn-warning"
                      onClick={() =>
                        navigate(`/update-workout-plan/${workoutPlan.id}`)
                      }
                    >
                      Update
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Are you sure you want to delete workout plan "${workoutPlan.name}"? This action cannot be undone.`
                          )
                        ) {
                          return;
                        }
                        api
                          .delete(`/workout-plans/${workoutPlan.id}`)
                          .then(() => {
                            setWorkoutPlans(
                              workoutPlans.filter(
                                (wp) => wp.id !== workoutPlan.id
                              )
                            );
                          })
                          .catch((error) => {
                            console.error(
                              "Error deleting workout plan:",
                              error
                            );
                          });
                      }}
                    >
                      Delete
                    </button>
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
    </div>
  );
};

export default WorkoutPlans;

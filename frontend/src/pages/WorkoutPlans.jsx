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
        setLoading(false);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-2 sm:px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            Workout Plans
          </h1>
          {workoutPlans.length > 0 && (
            <button
              className="hidden sm:inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
              onClick={() => navigate("/create-workout-plan")}
            >
              + Create
            </button>
          )}
        </div>

        {workoutPlans.length > 0 ? (
          <ul className="space-y-6">
            {workoutPlans.map((workoutPlan) => (
              <li
                key={workoutPlan.id}
                className="bg-white rounded-2xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition hover:shadow-lg"
              >
                <div>
                  <Link
                    className="text-xl font-semibold text-blue-700 hover:underline"
                    to={`/workout-plans/${workoutPlan.id}/workout-cycles/${workoutPlan.current_cycle_id}`}
                  >
                    {workoutPlan.name}
                  </Link>
                  <div className="text-sm text-gray-500 mt-1">
                    Created:{" "}
                    {new Date(workoutPlan.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <button
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow mr-2"
                    onClick={() =>
                      navigate(`/update-workout-plan/${workoutPlan.id}`)
                    }
                  >
                    Update
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow"
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
                          console.error("Error deleting workout plan:", error);
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
              onClick={() => navigate("/create-workout-plan")}
            >
              + Create Workout Plan
            </button>
          </div>
        )}

        {/* Floating create button for mobile */}
        {workoutPlans.length > 0 && (
          <button
            className="fixed bottom-5 right-5 z-20 sm:hidden bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useNavigate } from "react-router-dom";


const WorkoutPlans = () => {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.
      get("/workout-plans")
      .then((response) => {
        setWorkoutPlans(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching workout plans:", error);
        setError(error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Workout Plans</h1>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {workoutPlans.length > 0? (
        <>
        <ul>
          {workoutPlans.map((workoutPlan) => (
            <li key={workoutPlan.id}>
              <Link className="text-2xl mb-4" to={`/workout-plans/${workoutPlan.id}`}>Title: {workoutPlan.name}</Link>
              <p className="mb-4">Created at: {workoutPlan.created_at}</p>
              <button
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                onClick={() => {
                  navigate(`/update-workout-plan/${workoutPlan.id}`);
                }}
              >
                Update
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors ml-2"
                onClick={() => {
                  if (!window.confirm(`Are you sure you want to delete workout plan "${workoutPlan.name}"? This action cannot be undone.`)) {
                    return;
                  }
                  api
                    .delete(`/workout-plans/${workoutPlan.id}`)
                    .then(() => {
                      setWorkoutPlans(workoutPlans.filter((wp) => wp.id !== workoutPlan.id));
                    })
                    .catch((error) => {
                      console.error("Error deleting workout plan:", error);
                    });
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
        <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors mt-4"
                onClick={() => {
                  navigate("/create-workout-plan");
                }}
              >
                Create
          </button>
          </>
      ) : (
        <div className="flex flex-col items-start space-y-4">
              <p className="text-gray-700">Workout plans not found. Try creating it:</p>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                onClick={() => {
                  navigate("/create-workout-plan");
                }}
              >
                Create
              </button>
            </div>
      )}
    </div>
  )
};

export default WorkoutPlans;

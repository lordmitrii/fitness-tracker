import { useEffect, useState } from "react";
import api from "../api";


const WorkoutPlans = () => {
  const [workouts, setWorkouts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.
      get("/workout-plans")
      .then((response) => {
        setWorkouts(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching workouts:", error);
        setError(error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Workouts</h1>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {workouts && (
        <ul>
          {workouts.map((workout) => (
            <li key={workout.id}>
              <h2 className="text-2xl mb-4">Title: {workout.name}</h2>
              <p className="mb-4">Created at: {workout.created_at}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
};

export default WorkoutPlans;

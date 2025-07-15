import { useEffect, useState } from "react";
import api from "../api";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";

const ExerciseStats = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/individual-exercises/stats")
      .then((response) => {
        setStats(response.data);
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingState message="Loading your stats..." />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="card">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center">
        Your Exercise Stats
      </h1>
      {stats && stats.length > 0 ? (
        <div className="flex flex-col gap-6">
          {stats.map((exercise) => (
            <div
              key={exercise.id}
              className="sm:grid sm:grid-cols-2 bg-gray-50 rounded-xl shadow p-6 items-center justify-between gap-4 hover:shadow-lg transition border border-gray-200 shadow-md"
            >
              <div>
                <div className="text-lg font-semibold text-blue-700">
                  {exercise.name}
                </div>
                <div className="text-sm text-gray-500 capitalize mb-2">
                  {exercise.muscle_group && `${exercise.muscle_group.name}`}
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-sm mb-1">Current Best</div>
                {exercise.current_reps && exercise.current_weight ? (
                  <div className="inline-block rounded-lg bg-blue-100 text-blue-800 px-4 py-2 text-base font-semibold">
                    {exercise.current_weight} kg x {exercise.current_reps} reps
                  </div>
                ) : (
                  <div className="text-gray-400 italic">N/A</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-600 text-center py-8">
          No exercise stats available yet.
          <br />
          Start logging workouts to see your progress!
        </div>
      )}
    </div>
  );
};

export default ExerciseStats;

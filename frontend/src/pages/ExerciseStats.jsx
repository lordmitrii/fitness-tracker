import { useEffect, useState } from "react";
import api from "../api";

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center">
          Your Exercise Stats
        </h1>
        {stats && stats.length > 0 ? (
          <div className="flex flex-col gap-6">
            {stats.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-gray-50 rounded-xl shadow p-6 flex flex-row items-center justify-between gap-4 hover:shadow-md transition"
              >
                <div>
                  <div className="text-lg font-semibold text-blue-700">
                    {exercise.name}
                  </div>
                  <div className="text-sm text-gray-500 capitalize mb-2">
                    {exercise.muscle_group}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 text-sm mb-1">Current Best</div>
                  {exercise.current_reps && exercise.current_weight ? (
                    <div className="inline-block rounded-lg bg-blue-100 text-blue-800 px-4 py-2 text-base font-semibold">
                      {exercise.current_reps} reps × {exercise.current_weight}{" "}
                      kg
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
    </div>
  );
};

export default ExerciseStats;

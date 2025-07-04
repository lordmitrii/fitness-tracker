import { useEffect, useState } from "react";
import api from "../api";

const ExerciseStats = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/individual-exercises")
      .then((response) => {
        setStats(response.data);
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
    <div className="flex flex-col min-h-screen items-center justify-start bg-gray-100 py-12">
      <div className="w-full max-w-xl bg-white rounded shadow p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Your stats:</h2>
        {stats && stats.length > 0 ? (
          <table className="min-w-full bg-gray-50 rounded-xl">
            <thead>
              <tr>
                <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-1/4">
                  Exercise
                </th>
                <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-1/4">
                  Muscle Group
                </th>
                <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-2/4">
                  Current Best Working Weight
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((exercise) => (
                <tr key={exercise.id} className="border-b last:border-0">
                  <td className="py-2 px-4">{exercise.name}</td>
                  <td className="py-2 px-4">{exercise.muscle_group}</td>
                  <td className="py-2 px-4">
                    {exercise.current_reps && exercise.current_weight
                      ? `${exercise.current_reps} reps * ${exercise.current_weight} kg`
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">No exercise stats available.</p>
        )}
      </div>
    </div>
  );
};

export default ExerciseStats;

import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api";

const WorkoutPlanSingle = () => {
  const navigate = useNavigate();
  const { planID, cycleID } = useParams();
  const [workoutCycle, setWorkoutCycle] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [workouts, setWorkouts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/workout-plans/${planID}/workout-cycles/${cycleID}`)
      .then((res) => {
        setWorkoutCycle(res.data);
        setWorkouts(res.data.workouts);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching workout cycle:", error);
        setError(error);
        setLoading(false);
      });
  }, [planID, cycleID]);

  const handleCompleteToggle = () => setIsComplete((prev) => !prev);

  useEffect(() => {
    if (!workoutCycle) return;
    api
      .patch(
        `/workout-plans/${planID}/workout-cycles/${workoutCycle.id}/update-complete`,
        { completed: isComplete }
      )
      .catch((error) => {
        console.error("Error updating cycle completion status:", error);
        setError(error);
      });
  }, [isComplete]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      {workoutCycle && (
        <>
          {/* <h1 className="text-3xl font-bold mb-2">{workoutPlan.name}</h1> */}
          <h1 className="text-3xl font-bold mb-2">Workout Plan View</h1>
          <h2 className="text-xl text-gray-700 mb-6">
            Cycle:{" "}
            <span className="font-semibold">
              {workoutCycle.name}
            </span>
          </h2>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition mb-6"
            onClick={() =>
              navigate(
                `/workout-plans/${planID}/workout-cycles/${workoutCycle.previous_cycle_id}`
              )
            }
          >
            View Previous Cycle
          </button>
          {workouts && workouts.length > 0 ? (
            <div className="space-y-8">
              {workouts
                .slice()
                .sort((a, b) => a.index - b.index)
                .map((workout) => (
                  <div
                    key={workout.id}
                    className="rounded-2xl shadow-xl bg-white border border-gray-100 p-6 hover:shadow-2xl transition flex flex-col gap-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <Link
                          to={`/workout-plans/${planID}/workout-cycles/${workoutCycle.id}/workouts/${workout.id}`}
                          className="text-2xl font-semibold text-blue-800 hover:underline"
                        >
                          {workout.name}
                        </Link>
                        <div className="text-gray-400 text-sm mt-1">
                          Last updated:{" "}
                          {new Date(
                            workout.updated_at
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <button
                          className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow mr-2"
                          onClick={() =>
                            navigate(
                              `/workout-plans/${planID}/workout-cycles/${workoutCycle.id}/update-workout/${workout.id}`
                            )
                          }
                        >
                          Update
                        </button>
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow"
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Are you sure you want to delete workout "${workout.name}"? This action cannot be undone.`
                              )
                            ) {
                              return;
                            }
                            api
                              .delete(
                                `/workout-plans/${workout.id}/workout-cycles/${workoutCycle.id}/workouts/${workout.id}`
                              )
                              .then(() => {
                                setWorkouts(
                                  workouts.filter(
                                    (w) => w.id !== workout.id
                                  )
                                );
                              })
                              .catch((error) => {
                                alert(
                                  "Error deleting workout: " + error.message
                                );
                              });
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {workout.workout_exercises &&
                      workout.workout_exercises.length > 0 && (
                        <div className="mt-4 overflow-x-auto">
                          <table className="min-w-full bg-gray-50 rounded-xl">
                            <thead>
                              <tr>
                                <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b">
                                  Exercise
                                </th>
                                <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b">
                                  Sets
                                </th>
                                <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b">
                                  Reps
                                </th>
                                <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b">
                                  Weight
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {workout.workout_exercises
                                .slice()
                                .sort((a, b) => a.index - b.index)
                                .map((ex, idx) => (
                                  <tr
                                    key={ex.id}
                                    className={
                                      idx % 2 === 0
                                        ? "bg-white border-b last:border-0"
                                        : "bg-gray-100 border-b last:border-0"
                                    }
                                  >
                                    <td className="py-2 px-4">
                                      {ex.exercise.name}
                                    </td>
                                    <td className="py-2 px-4">{ex.sets}</td>
                                    <td className="py-2 px-4">{ex.reps}</td>
                                    <td className="py-2 px-4">
                                      {ex.weight} kg
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500">No workouts in this cycle yet.</p>
          )}

          <div className="flex items-center gap-4 mt-10">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
              onClick={() =>
                navigate(
                  `/workout-plans/${planID}/workout-cycles/${workoutCycle.id}/create-workout`
                )
              }
            >
              + Create Workout
            </button>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="form-checkbox accent-blue-600"
                checked={isComplete}
                onChange={handleCompleteToggle}
              />
              <span className="text-gray-700">Mark cycle as complete</span>
            </label>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkoutPlanSingle;

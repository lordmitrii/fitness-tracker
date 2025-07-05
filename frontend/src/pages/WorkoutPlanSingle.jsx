import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api";
import AddWorkoutExerciseModal from "../components/AddWorkoutExerciseModal";
import WorkoutCard from "../components/WorkoutCard";

const WorkoutPlanSingle = () => {
  const navigate = useNavigate();
  const { planID, cycleID } = useParams();
  const [workoutCycle, setWorkoutCycle] = useState(null);
  const [workouts, setWorkouts] = useState([]);

  const [nextCycleID, setNextCycleID] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  const [allWorkoutsCompleted, setAllWorkoutsCompleted] = useState(false);
  const [cycleCompleted, setCycleCompleted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/workout-plans/${planID}/workout-cycles/${cycleID}`)
      .then((res) => {
        setWorkoutCycle(res.data);
        setWorkouts(res.data.workouts);
        setCycleCompleted(res.data.completed);
        setNextCycleID(res.data.next_cycle_id);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching workout cycle:", error);
        setError(error);
        setLoading(false);
      });
  }, [planID, cycleID]);

  useEffect(() => {
    const allCompleted =
      workouts.length > 0 && workouts.every((w) => w.completed);
    setAllWorkoutsCompleted(allCompleted);
  }, [workouts]);

  const handleToggleExercise = (
    workoutId,
    exId,
    setId,
    reps,
    weight,
    checked
  ) => {
    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.id !== workoutId) return w;

        const newExercises = w.workout_exercises.map((ex) => {
          if (ex.id !== exId) return ex;
          const newSets = ex.workout_sets.map((s) =>
            s.id === setId ? { ...s, completed: checked, reps, weight } : s
          );
          const exerciseCompleted =
            newSets.length > 0 && newSets.every((s) => s.completed);
          return { ...ex, workout_sets: newSets, completed: exerciseCompleted };
        });

        const workoutCompleted =
          newExercises.length > 0 &&
          newExercises.every(
            (ex) =>
              ex.workout_sets.length > 0 &&
              ex.workout_sets.every((s) => s.completed)
          );

        return {
          ...w,
          workout_exercises: newExercises,
          completed: workoutCompleted,
        };
      })
    );

    api
      .patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutId}/workout-exercises/${exId}/workout-sets/${setId}/update-complete`,
        { completed: checked }
      )
      .catch((error) => {
        setError(error);
      });

    // If the set is not completed, we don't need to update sets, reps, and weight
    if (!checked) return;

    api
      .patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutId}/workout-exercises/${exId}/workout-sets/${setId}`,
        { reps, weight }
      )
      .catch((error) => {
        setError(error);
      });
  };

  const handleCycleComplete = () => {
    if (
      !allWorkoutsCompleted &&
      !window.confirm(
        `Are you sure you want to complete this cycle? Some workouts are not completed.`
      )
    ) {
      return;
    }

    setCycleCompleted(true);

    // Optionally, mark all workouts as completed
    // if (nextCompleted) {
    //   setWorkouts((prev) =>
    //     prev.map((w) => ({
    //       ...w,
    //       completed: true,
    //       workout_exercises: w.workout_exercises.map((ex) => ({
    //         ...ex,
    //         completed: true,
    //       })),
    //     }))
    //   );
    // }

    api
      .patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/update-complete`,
        { completed: true }
      )
      .then((res) => {
        setNextCycleID(res.data.next_cycle_id);
      })
      .catch((error) => {
        setError(error);
      });
  };

  const handleSaveExercise = (newExercise) => {
    api
      .post(`individual-exercises`, {
        exercise_id: newExercise.exercise.id,
        name: newExercise.exercise.name,
        muscle_group: newExercise.exercise.muscle_group,
      })
      .then((res1) => {
        delete newExercise.exercise; // Remove the exercise object to match the API structure
        const individualExercise = res1.data;
        api
          .post(
            `workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${selectedWorkout.id}/workout-exercises`,
            {
              individual_exercise_id: individualExercise.id,
              sets_qt: newExercise.sets,
            }
          )
          .then((res2) => {
            const exerciseToAdd = {
              ...res2.data,
              individual_exercise: individualExercise,
            };
            setWorkouts((prevWorkouts) =>
              prevWorkouts.map((w) =>
                w.id === selectedWorkout.id
                  ? {
                      ...w,
                      workout_exercises: [
                        ...w.workout_exercises,
                        exerciseToAdd,
                      ],
                      completed: false,
                    }
                  : w
              )
            );
            setModalOpen(false);
            setSelectedWorkout(null);
          })
          .catch((error) => {
            setError(error);
          });
      })
      .catch((error) => {
        setError(error);
        return;
      });
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        `Are you sure you want to delete cycle "${workoutCycle.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    api
      .delete(`/workout-plans/${planID}/workout-cycles/${cycleID}`)
      .then(() => {
        navigate(
          `/workout-plans/${planID}/workout-cycles/${workoutCycle.previous_cycle_id}`
        );
        setNextCycleID(null);
      })
      .catch((error) => {
        setError(error);
      });
  };

  const handleDeleteWorkout = (workoutId) => {
    const workout = workouts.find((w) => w.id === workoutId);
    if (
      !window.confirm(
        `Are you sure you want to delete workout "${workout.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    api
      .delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workout.id}`
      )
      .then(() => {
        setWorkouts(workouts.filter((w) => w.id !== workout.id));
      })
      .catch((error) => {
        alert("Error deleting workout: " + error.message);
        console.error("Error deleting workout:", error);
      });
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      {workoutCycle && (
        <>
          {/* <h1 className="text-3xl font-bold mb-2">{workoutPlan.name}</h1> */}
          <h1 className="text-3xl font-bold mb-2">Workout Plan View</h1>
          <h2 className="text-xl text-gray-700 mb-6">
            Cycle: <span className="font-semibold">{workoutCycle.name}</span>
          </h2>
          <div className="flex flex-row gap-4 mb-8">
            <div className="w-1/3">
              {workoutCycle.previous_cycle_id && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition w-auto"
                  onClick={() =>
                    navigate(
                      `/workout-plans/${planID}/workout-cycles/${workoutCycle.previous_cycle_id}`
                    )
                  }
                >
                  <span className="flex items-center justify-between">
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
                        d="M15.75 19.5 8.25 12l7.5-7.5"
                      />
                    </svg>
                    <div className="hidden sm:block">View Next Cycle</div>
                  </span>
                </button>
              )}
            </div>
            <div className="w-1/3 text-center">
              {workoutCycle.previous_cycle_id && (
                <button
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition w-full sm:w-auto"
                  onClick={handleDelete}
                >
                  Delete Cycle
                </button>
              )}
            </div>
            <div className="w-1/3 text-right">
              {(workoutCycle.next_cycle_id || nextCycleID) && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition w-auto sm:ml-auto"
                  onClick={() =>
                    navigate(
                      `/workout-plans/${planID}/workout-cycles/${
                        workoutCycle.next_cycle_id || nextCycleID
                      }`
                    )
                  }
                >
                  <span className="flex items-center justify-between">
                    <div className="hidden sm:block">View Next Cycle</div>
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
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </span>
                </button>
              )}
            </div>
          </div>
          {workouts && workouts.length > 0 ? (
            <div className="space-y-8">
              {workouts
                .slice()
                .sort((a, b) => a.index - b.index)
                .map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    planID={planID}
                    cycleID={cycleID}
                    workout={workout}
                    onToggleExercise={handleToggleExercise}
                    setModalOpen={setModalOpen}
                    setSelectedWorkout={setSelectedWorkout}
                    onDelete={handleDeleteWorkout}
                    isCurrentCycle={!nextCycleID}
                  />
                ))}
            </div>
          ) : (
            <p className="text-gray-500">No workouts in this cycle yet.</p>
          )}

          <div className="flex items-center gap-4 mt-10">
            {!nextCycleID && (
              <>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
                  onClick={() =>
                    navigate(
                      `/workout-plans/${planID}/workout-cycles/${cycleID}/create-workout`
                    )
                  }
                >
                  + Create Workout
                </button>
                {!cycleCompleted && (
                  <button
                    className={`${
                      allWorkoutsCompleted
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    } text-white font-semibold py-2 px-6 rounded-lg shadow transition`}
                    onClick={handleCycleComplete}
                  >
                    Complete Cycle
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
      <AddWorkoutExerciseModal
        open={modalOpen}
        workout={selectedWorkout}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveExercise}
      />
    </div>
  );
};

export default WorkoutPlanSingle;

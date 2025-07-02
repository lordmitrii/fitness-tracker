import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api";
import AddWorkoutExerciseModal from "../components/AddWorkoutExerciseModal";
import WorkoutExerciseTable from "../components/WorkoutExerciseTable";
import WorkoutCard from "../components/WorkoutCard";

const WorkoutPlanSingle = () => {
  const navigate = useNavigate();
  const { planID, cycleID } = useParams();
  const [workoutCycle, setWorkoutCycle] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [workouts, setWorkouts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextCycleID, setNextCycleID] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [allWorkoutsComplete, setAllWorkoutsComplete] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/workout-plans/${planID}/workout-cycles/${cycleID}`)
      .then((res) => {
        setWorkoutCycle(res.data);
        setWorkouts(res.data.workouts);
        setIsComplete(res.data.completed);
        setNextCycleID(res.data.next_cycle_id);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching workout cycle:", error);
        setError(error);
        setLoading(false);
      });
  }, [planID, cycleID]);

  const handleCompleteToggle = () => {
    const nextComplete = !isComplete;

    api
      .patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/update-complete`,
        {
          completed: nextComplete,
        }
      )
      .then((res) => {
        setIsComplete(nextComplete);
        setNextCycleID(res.data.next_cycle_id);
      })
      .catch((error) => {
        console.error("Error updating cycle completion status:", error);
        setError(error);
      });
  };

  const handleSaveExercise = (newExercise) => {
    api
      .post(
        `workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${selectedWorkout.id}/workout-exercises`,
        {
          exercise_id: newExercise.exercise.id,
          sets: newExercise.sets,
          reps: newExercise.reps,
          weight: newExercise.weight,
        }
      )
      .then(() => {
        setWorkouts((prevWorkouts) =>
          prevWorkouts.map((w) =>
            w.id === selectedWorkout.id
              ? {
                  ...w,
                  workout_exercises: [...w.workout_exercises, newExercise],
                }
              : w
          )
        );
        setModalOpen(false);
        setSelectedWorkout(null);
      })
      .catch((error) => {
        alert("Error saving exercise: " + error.message);
        console.error("Error saving exercise:", error);
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
        alert("Error deleting cycle: " + error.message);
        console.error("Error deleting cycle:", error);
      });
  };

  useEffect(() => {
    if (workouts) {
      const allComplete = workouts.every(
        (workout) =>
          (workout.workout_exercises ||
            workout.workout_exercises.length <= 0) &&
          workout.completed
      );
      setAllWorkoutsComplete(allComplete);
    }
  }, [workouts]);

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
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="w-1/3">
              {workoutCycle.previous_cycle_id && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition w-full md:w-auto"
                  onClick={() =>
                    navigate(
                      `/workout-plans/${planID}/workout-cycles/${workoutCycle.previous_cycle_id}`
                    )
                  }
                >
                  &lt; View Previous Cycle
                </button>
              )}
            </div>
            <div className="w-1/3 text-center">
              {workoutCycle.previous_cycle_id && (
                <button
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition w-full md:w-auto"
                  onClick={handleDelete}
                >
                  Delete Cycle
                </button>
              )}
            </div>
            <div className="w-1/3 text-right">
              {(workoutCycle.next_cycle_id || nextCycleID) && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition w-full md:w-auto md:ml-auto"
                  onClick={() =>
                    navigate(
                      `/workout-plans/${planID}/workout-cycles/${
                        workoutCycle.next_cycle_id || nextCycleID
                      }`
                    )
                  }
                >
                  View Next Cycle &gt;
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
                    planID={planID}
                    cycleID={cycleID}
                    workout={workout}
                    setWorkouts={setWorkouts}
                    setModalOpen={setModalOpen}
                    setSelectedWorkout={setSelectedWorkout}
                    workouts={workouts}
                  />
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
                  `/workout-plans/${planID}/workout-cycles/${cycleID}/create-workout`
                )
              }
            >
              + Create Workout
            </button>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="form-checkbox accent-blue-600 h-5 w-5"
                checked={isComplete}
                onChange={handleCompleteToggle}
                disabled={!allWorkoutsComplete}
              />
              <span className="text-gray-700">Mark cycle as complete</span>
            </label>
          </div>
        </>
      )}
      <AddWorkoutExerciseModal
        open={modalOpen}
        workout={selectedWorkout}
        onClose={() => setModalOpen(false)}
        onSave={(newExercise) => {
          handleSaveExercise(newExercise);
        }}
      />
    </div>
  );
};

export default WorkoutPlanSingle;

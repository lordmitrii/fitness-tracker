import { Link, useNavigate } from "react-router-dom";
import WorkoutExerciseTable from "./WorkoutExerciseTable";

const WorkoutCard = ({
  planID,
  cycleID,
  workout,
  onToggleExercise,
  setModalOpen,
  setSelectedWorkout,
  onDelete,
  isCurrentCycle,
}) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl sm:shadow-md bg-white sm:border sm:border-gray-200 sm:p-6 sm:hover:shadow-lg transition flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-2xl font-semibold text-blue-800">
            {workout.name}
          </span>
          <div className="text-gray-400 text-sm mt-1">
            Last updated: {new Date(workout.updated_at).toLocaleDateString()}
            <br />
            Completed:{" "}
            {workout.completed ? (
              <span className="text-green-600 font-semibold">Yes</span>
            ) : (
              <span className="text-red-600 font-semibold">No</span>
            )}
          </div>
        </div>
        <div className="mt-2 sm:mt-0">
          <button
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow mr-2"
            onClick={() =>
              navigate(
                `/workout-plans/${planID}/workout-cycles/${cycleID}/update-workout/${workout.id}`
              )
            }
          >
            Update
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow"
            onClick={() => onDelete(workout.id)}
          >
            Delete
          </button>
        </div>
      </div>
      {workout.workout_exercises && workout.workout_exercises.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <WorkoutExerciseTable
            key={workout.id}
            exercises={workout.workout_exercises}
            onToggle={(exId, setId, reps, weight, checked) =>
              onToggleExercise(workout.id, exId, setId, reps, weight, checked)
            }
            isCurrentCycle={isCurrentCycle}
          />
        </div>
      )}
      <div className="flex justify-center mt-4">
        {isCurrentCycle && (
          <button
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition w-full sm:w-auto"
            onClick={() => {
              setSelectedWorkout(workout);
              setModalOpen(true);
            }}
          >
            <span>+ Add Exercise</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkoutCard;

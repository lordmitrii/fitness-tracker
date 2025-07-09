import WorkoutExerciseTable from "./WorkoutExerciseTable";
import DropdownMenu from "./DropdownMenu";
import WorkoutDetailsMenu from "./WorkoutDetailsMenu";
import AddWorkoutExerciseModal from "./AddWorkoutExerciseModal";

const WorkoutCard = ({
  planID,
  cycleID,
  workout,
  onDeleteWorkout,
  isCurrentCycle,
  onUpdateWorkouts,
  onError,
}) => {
  return (
    <div className="sm:rounded-2xl shadow-lg bg-white sm:border sm:border-gray-200 p-6 sm:hover:shadow-lg transition flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-blue-800">
            {workout.name}
          </h1>
          <DropdownMenu
            dotsHorizontal={true}
            dotsHidden={!isCurrentCycle}
            menu={({ close }) => (
              <WorkoutDetailsMenu
                closeMenu={close}
                planID={planID}
                cycleID={cycleID}
                workout={workout}
                updateWorkouts={onUpdateWorkouts}
                onDeleteWorkout={onDeleteWorkout}
                onError={onError}
              />
            )}
          />
        </div>
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
      {workout.workout_exercises && workout.workout_exercises.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <WorkoutExerciseTable
            key={workout.id}
            planID={planID}
            cycleID={cycleID}
            workoutID={workout.id}
            exercises={workout.workout_exercises}
            isCurrentCycle={isCurrentCycle}
            onUpdateExercises={(newExercises) =>
              onUpdateWorkouts(workout.id, newExercises)
            }
            onError={onError}
          />
        </div>
      )}
      <div className="flex justify-center mt-4">
        {isCurrentCycle && (
          <AddWorkoutExerciseModal
            workout={workout}
            planID={planID}
            cycleID={cycleID}
            onUpdateWorkouts={onUpdateWorkouts}
            onError={onError}
          />
        )}
      </div>
    </div>
  );
};

export default WorkoutCard;

import WorkoutExerciseTable from "./WorkoutExerciseTable";
import DropdownMenu from "../DropdownMenu";
import WorkoutDetailsMenu from "./WorkoutDetailsMenu";
import AddWorkoutExerciseModal from "../../modals/workout/AddWorkoutExerciseModal";
import { useTranslation } from "react-i18next";

const WorkoutCard = ({
  planID,
  cycleID,
  workout,
  onDeleteWorkout,
  isCurrentCycle,
  onUpdateWorkouts,
  onError,
}) => {
  const { t } = useTranslation();
  return (
    <div className="sm:rounded-2xl shadow-lg bg-white sm:border sm:border-gray-200 p-6 sm:hover:shadow-lg transition flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-body-blue font-extrabold">{workout.name}</h1>
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
        <div className="text-caption mt-1">
          {t("general.last_updated")}{" "}
          {new Date(workout.updated_at).toLocaleDateString()}
          <br />
          {t("general.completed")}:{" "}
          {workout.completed ? (
            <span className="text-green-600 font-semibold">
              {t("general.yes")}
            </span>
          ) : (
            <span className="text-red-600 font-semibold">
              {t("general.no")}
            </span>
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
            workoutName={workout.name}
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
            trigger={
              <button className="btn btn-primary flex items-center gap-2">
                <span>+ {t("workout_plan_single.add_exercise")}</span>
              </button>
            }
            workoutID={workout.id}
            workoutName={workout.name}
            planID={planID}
            cycleID={cycleID}
            onUpdateExercises={(newExercises) =>
              onUpdateWorkouts(workout.id, newExercises)
            }
            onError={onError}
          />
        )}
      </div>
    </div>
  );
};

export default WorkoutCard;

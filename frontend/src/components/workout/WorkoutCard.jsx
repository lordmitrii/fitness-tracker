import WorkoutExerciseTable from "./WorkoutExerciseTable";
import DropdownMenu from "../DropdownMenu";
import WorkoutDetailsMenu from "./WorkoutDetailsMenu";
import { useTranslation } from "react-i18next";
import { memo, useCallback } from "react";

const WorkoutCard = ({
  planID,
  cycleID,
  workout,
  onDeleteWorkout,
  isCurrentCycle,
  onUpdateWorkouts,
  onError,
  onOpenAddExercise,
  onOpenReplaceExercise,
}) => {
  const { t, i18n } = useTranslation();

  const handleUpdateExercises = useCallback(
    (newExercises) => onUpdateWorkouts(workout.id, newExercises),
    [onUpdateWorkouts, workout.id]
  );

  const handleOpenReplace = useCallback(
    (exerciseID) =>
      onOpenReplaceExercise?.({
        workoutId: workout.id,
        workoutName: workout.name,
        exerciseId: exerciseID,
      }),
    [onOpenReplaceExercise, workout.id, workout.name]
  );

  const renderWorkoutDetailsMenu = useCallback(
    ({ close }) => (
      <WorkoutDetailsMenu
        closeMenu={close}
        planID={planID}
        cycleID={cycleID}
        workoutID={workout.id}
        workoutName={workout.name}
        updateWorkouts={onUpdateWorkouts}
        onDeleteWorkout={onDeleteWorkout}
        onError={onError}
      />
    ),
    [
      planID,
      cycleID,
      workout.id,
      workout.name,
      onUpdateWorkouts,
      onDeleteWorkout,
      onError,
    ]
  );

  return (
    <div className="sm:rounded-2xl shadow-lg bg-white sm:border sm:border-gray-200 p-6 sm:hover:shadow-lg transition flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-body-blue font-extrabold">{workout.name}</h1>
          <DropdownMenu
            dotsHorizontal={true}
            dotsHidden={!isCurrentCycle}
            menu={renderWorkoutDetailsMenu}
          />
        </div>
        <div className="text-caption mt-1">
          {t("general.last_updated")}{" "}
          {new Date(workout.updated_at).toLocaleDateString(i18n.language)}
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
            planID={planID}
            cycleID={cycleID}
            workoutID={workout.id}
            workoutName={workout.name}
            exercises={workout.workout_exercises}
            isCurrentCycle={isCurrentCycle}
            onUpdateExercises={handleUpdateExercises}
            onError={onError}
            onOpenReplaceExercise={handleOpenReplace}
          />
        </div>
      )}
      <div className="flex justify-center mt-4">
        {isCurrentCycle && (
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={() =>
              onOpenAddExercise?.({ id: workout.id, name: workout.name })
            }
          >
            <span>+ {t("workout_plan_single.add_exercise")}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(WorkoutCard);

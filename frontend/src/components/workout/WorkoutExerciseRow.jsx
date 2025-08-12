import { memo, useMemo, useCallback } from "react";
import DropdownMenu from "../DropdownMenu";
import WorkoutExerciseDetailsMenu from "./WorkoutExerciseDetailsMenu";
import { useTranslation } from "react-i18next";
import WorkoutSetRow from "./WorkoutSetRow";

const WorkoutExerciseRow = ({
  planID,
  cycleID,
  workoutID,
  workoutName,
  exercise,
  allExercises,
  isCurrentCycle,
  onUpdateExercises,
  onError,
}) => {
  const { t } = useTranslation();

  const sortedSets = useMemo(
    () =>
      (exercise.workout_sets || []).slice().sort((a, b) => a.index - b.index),
    [exercise.workout_sets]
  );

  const renderExerciseMenu = useCallback(
    ({ close }) => (
      <WorkoutExerciseDetailsMenu
        planID={planID}
        cycleID={cycleID}
        workoutID={workoutID}
        workoutName={workoutName}
        exercise={exercise}
        exercises={allExercises}
        updateExercises={onUpdateExercises}
        closeMenu={close}
        onError={onError}
      />
    ),
    [
      planID,
      cycleID,
      workoutID,
      workoutName,
      exercise,
      allExercises,
      onUpdateExercises,
      onError,
    ]
  );

  return (
    <div className="sm:rounded-2xl shadow-md bg-white sm:p-4 flex flex-col gap-4 sm:border sm:border-gray-100">
      <div>
        <div className="flex flex-row items-start sm:items-center justify-between gap-1">
          <div className="font-medium text-body-blue">
            {exercise.index}.{" "}
            {!!exercise.individual_exercise.exercise?.slug
              ? t(`exercise.${exercise.individual_exercise.exercise.slug}`)
              : exercise.individual_exercise.name}
            <span className="ml-2 text-caption font-bold">
              {exercise.individual_exercise.muscle_group &&
                `(${t(
                  `muscle_group.${exercise.individual_exercise.muscle_group.slug}`
                )})`}
            </span>
          </div>
          <DropdownMenu
            dotsHorizontal
            dotsHidden={!isCurrentCycle}
            menu={renderExerciseMenu}
          />
        </div>
        <div className="flex text-caption">
          {exercise.individual_exercise.is_bodyweight &&
            t("workout_plan_single.bodyweight_exercise")}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full grid grid-cols-[6dvw_minmax(20dvw,1fr)_minmax(20dvw,1fr)_minmax(0,6dvw)_1fr] sm:grid-cols-[36px_1fr_1fr_1fr_1fr_1fr] gap-4 text-gray-600 font-semibold border-b pb-2 sm:text-normal text-sm">
          <div className=""></div>
          <div className="hidden sm:block">
            {t("workout_plan_single.set_label")}
          </div>
          <div className="whitespace-nowrap">
            {t("workout_plan_single.weight_label")} ({t("measurements.weight")})
          </div>
          <div className="">
            {exercise.individual_exercise.is_time_based
              ? t("workout_plan_single.time_label")
              : t("workout_plan_single.reps_label")}
          </div>
          <div className="invisible sm:visible text-center">
            {t("workout_plan_single.badge_label")}
          </div>
          <div className="text-center">
            {t("workout_plan_single.done_label")}
          </div>
        </div>
        <div className="flex flex-col divide-y">
          {sortedSets.map((set) => (
            <WorkoutSetRow
              key={set.id}
              planID={planID}
              cycleID={cycleID}
              workoutID={workoutID}
              exercise={exercise}
              setItem={set}
              isCurrentCycle={isCurrentCycle}
              onUpdateExercises={onUpdateExercises}
              onError={onError}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(WorkoutExerciseRow);

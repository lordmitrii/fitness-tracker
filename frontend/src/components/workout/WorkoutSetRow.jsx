import { memo, useCallback } from "react";
import DropdownMenu from "../DropdownMenu";
import WorkoutSetDetailsMenu from "./WorkoutSetDetailsMenu";
import CheckBox from "../CheckBox";
import { getExerciseProgressBadge } from "../../utils/exerciseUtils";
import api from "../../api";
import { useTranslation } from "react-i18next";

const isValidInputs = (setItem) => {
  console.log(setItem);
  const { reps, weight } = setItem;
  if (typeof reps !== "number" || typeof weight !== "number") return false;
  if (Number.isNaN(reps) || Number.isNaN(weight)) return false;
  if (!Number.isInteger(reps)) return false;
  if (reps <= 0 || weight < 0) return false;
  return true;
};

const WorkoutSetRow = ({
  planID,
  cycleID,
  workoutID,
  exercise,
  setItem,
  isCurrentCycle,
  onUpdateExercises,
  onError,
}) => {
  const { t } = useTranslation();

  const onChangeWeight = useCallback(
    (value) => {
      onUpdateExercises((prev) =>
        prev.map((item) =>
          item.id === exercise.id
            ? {
                ...item,
                workout_sets: item.workout_sets.map((s) =>
                  s.index === setItem.index
                    ? { ...s, weight: value, completed: false }
                    : s
                ),
              }
            : item
        )
      );
    },
    [onUpdateExercises, exercise.id, setItem.index]
  );

  const onChangeReps = useCallback(
    (value) => {
      onUpdateExercises((prev) =>
        prev.map((item) =>
          item.id === exercise.id
            ? {
                ...item,
                workout_sets: item.workout_sets.map((s) =>
                  s.index === setItem.index
                    ? { ...s, reps: value, completed: false }
                    : s
                ),
              }
            : item
        )
      );
    },
    [onUpdateExercises, exercise.id, setItem.index]
  );

  const handleToggle = useCallback(
    async (checked, reps, weight) => {
      if (checked && !isValidInputs({ reps, weight })) {
        alert(t("workout_plan_single.please_check_fields"));
        return;
      }

      const rollback = (prev) =>
        prev.map((item) => {
          if (item.id !== exercise.id) return item;
          const newSets = item.workout_sets.map((s) =>
            s.id === setItem.id ? { ...s, completed: !checked } : s
          );
          const exerciseCompleted = newSets.every((s) => s.completed);
          return {
            ...item,
            workout_sets: newSets,
            completed: exerciseCompleted,
          };
        });

      onUpdateExercises((prev) =>
        prev.map((item) => {
          if (item.id !== exercise.id) return item;
          const newSets = item.workout_sets.map((s) =>
            s.id === setItem.id ? { ...s, completed: checked } : s
          );
          const exerciseCompleted = newSets.every((s) => s.completed);
          return {
            ...item,
            workout_sets: newSets,
            completed: exerciseCompleted,
          };
        })
      );

      try {
        await api.patch(
          `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exercise.id}/workout-sets/${setItem.id}/update-complete`,
          { completed: checked }
        );

        if (!checked) return;

        await api.patch(
          `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exercise.id}/workout-sets/${setItem.id}`,
          { reps, weight }
        );
      } catch (e) {
        onUpdateExercises(rollback);
        onError(e);
        console.error("Error toggling set completion:", e);
      }
    },
    [
      onUpdateExercises,
      exercise.id,
      setItem.id,
      t,
      planID,
      cycleID,
      workoutID,
      onError,
    ]
  );

  const renderSetMenu = useCallback(
    ({ close }) => (
      <WorkoutSetDetailsMenu
        planID={planID}
        cycleID={cycleID}
        workoutID={workoutID}
        set={setItem}
        exercise={exercise}
        updateExercises={onUpdateExercises}
        closeMenu={close}
        onError={onError}
      />
    ),
    [planID, cycleID, workoutID, setItem, exercise, onUpdateExercises, onError]
  );

  const onCheckBoxChange = useCallback(
    (e) => {
      handleToggle(e.target.checked, setItem.reps, setItem.weight);
    },
    [handleToggle, setItem.reps, setItem.weight]
  );

  return (
    <div className="min-w-full grid grid-cols-[6dvw_minmax(20dvw,1fr)_minmax(20dvw,1fr)_minmax(0,6dvw)_1fr] sm:grid-cols-[36px_1fr_1fr_1fr_1fr_1fr] gap-4 items-center py-2">
      <DropdownMenu dotsHidden={!isCurrentCycle} isLeft menu={renderSetMenu} />
      <div className="hidden sm:block font-bold text-gray-600">
        {setItem.index}
      </div>

      <input
        type="number"
        placeholder={setItem.previous_weight}
        value={setItem.weight || ""}
        min={0}
        inputMode="decimal"
        onChange={(e) => onChangeWeight(Number(e.target.value))}
        className={`input-style placeholder:italic ${
          setItem.completed || !isCurrentCycle
            ? "opacity-40 cursor-not-allowed"
            : ""
        }`}
        disabled={!isCurrentCycle}
      />

      <input
        type="number"
        placeholder={setItem.previous_reps}
        value={setItem.reps || ""}
        min={1}
        inputMode="numeric"
        onChange={(e) => onChangeReps(Number(e.target.value))}
        className={`input-style placeholder:italic ${
          setItem.completed || !isCurrentCycle
            ? "opacity-40 cursor-not-allowed"
            : ""
        }`}
        disabled={!isCurrentCycle}
      />

      <span className="text-gray-600 w-5 justify-self-center">
        {getExerciseProgressBadge(setItem)}
      </span>

      <CheckBox
        title={t("workout_plan_single.set_completed")}
        checked={!!setItem.completed}
        onChange={onCheckBoxChange}
        disabled={!isCurrentCycle}
      />
    </div>
  );
};

export default memo(WorkoutSetRow);

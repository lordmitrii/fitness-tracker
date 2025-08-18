import { memo, useCallback, useState } from "react";
import DropdownMenu from "../DropdownMenu";
import WorkoutSetDetailsMenu from "./WorkoutSetDetailsMenu";
import CheckBox from "../CheckBox";
import { getExerciseProgressBadge } from "../../utils/exerciseUtils";
import api from "../../api";
import { useTranslation } from "react-i18next";
import { withOptimisticUpdate } from "../../utils/updates";
import { toNumberOrEmpty, toNullIfEmpty } from "../../utils/numberUtils";
import { SET_LIMITS } from "../../config/constants";
import { ChartEqualIcon } from "../../icons/ChartIcon";

const WorkoutSetRow = ({
  planID,
  cycleID,
  workoutID,
  exerciseID,
  setItem,
  setOrder,
  isCurrentCycle,
  onUpdateExercises,
  onError,
}) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState({});

  const validateSet = useCallback(
    (setItem, { isOnBlur = false } = {}) => {
      const errors = {};

      if (setItem.skipped) {
        return;
      }
      // reps: required, integer, range
      if (setItem.reps === "" || setItem.reps === null) {
        if (!isOnBlur) {
          errors.reps = t("workout_plan_single.validation.reps_required");
        }
      } else if (!Number.isFinite(setItem.reps)) {
        errors.reps = t("workout_plan_single.validation.reps_number");
      } else if (!Number.isInteger(setItem.reps)) {
        errors.reps = t("workout_plan_single.validation.reps_integer");
      } else if (
        setItem.reps < SET_LIMITS.reps.min ||
        setItem.reps > SET_LIMITS.reps.max
      ) {
        errors.reps = t("workout_plan_single.validation.reps_range", {
          min: SET_LIMITS.reps.min,
          max: SET_LIMITS.reps.max,
        });
      }

      // weight: required, number, range
      if (setItem.weight === "" || setItem.weight === null) {
        if (!isOnBlur) {
          errors.weight = t("workout_plan_single.validation.weight_required");
        }
      } else if (!Number.isFinite(setItem.weight)) {
        errors.weight = t("workout_plan_single.validation.weight_number");
      } else if (
        setItem.weight < SET_LIMITS.weight.min ||
        setItem.weight > SET_LIMITS.weight.max
      ) {
        errors.weight = t("workout_plan_single.validation.weight_range", {
          min: SET_LIMITS.weight.min,
          max: SET_LIMITS.weight.max,
          unit: t("measurements.weight"),
        });
      }

      return { ok: Object.keys(errors).length === 0, errors };
    },
    [t, setItem.reps, setItem.weight, setItem.skipped]
  );

  const patchSetFields = useCallback(
    async ({ reps, weight }) => {
      const optimisticUpdater = (prev) =>
        prev.map((item) =>
          item.id === exerciseID
            ? {
                ...item,
                workout_sets: item.workout_sets.map((s) =>
                  s.id === setItem.id ? { ...s, reps, weight } : s
                ),
              }
            : item
        );

      await withOptimisticUpdate(
        onUpdateExercises,
        optimisticUpdater,
        async () => {
          await api.patch(
            `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setItem.id}`,
            { reps: toNullIfEmpty(reps), weight: toNullIfEmpty(weight) }
          );
        }
      );
    },
    [onUpdateExercises, exerciseID, setItem.id, planID, cycleID, workoutID]
  );

  const patchCompleted = useCallback(
    async (completed) => {
      const optimisticUpdater = (prev) =>
        prev.map((item) =>
          item.id === exerciseID
            ? {
                ...item,
                workout_sets: item.workout_sets.map((s) =>
                  s.id === setItem.id ? { ...s, completed } : s
                ),
              }
            : item
        );

      await withOptimisticUpdate(
        onUpdateExercises,
        optimisticUpdater,
        async () => {
          await api.patch(
            `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setItem.id}/update-complete`,
            { completed }
          );
        }
      );
    },
    [onUpdateExercises, exerciseID, setItem.id, planID, cycleID, workoutID]
  );

  const onChangeWeight = useCallback(
    async (value) => {
      const clamped =
        value === ""
          ? ""
          : Math.max(
              SET_LIMITS.weight.min,
              Math.min(value, SET_LIMITS.weight.max)
            );

      onUpdateExercises((prev) =>
        prev.map((item) => {
          if (item.id !== exerciseID) return item;
          const newSets = item.workout_sets.map((s) =>
            s.id === setItem.id
              ? { ...s, weight: clamped, completed: false, skipped: false }
              : s
          );

          return {
            ...item,
            workout_sets: newSets,
            completed: false,
          };
        })
      );

      if (setItem.completed || setItem.skipped) {
        try {
          await patchCompleted(false);
        } catch (error) {
          console.error("Error unchecking completed set:", error);
          onError(error);
        }
      }

      validateSet(
        { ...setItem, weight: clamped, completed: false, skipped: false },
        { isOnBlur: false }
      );
    },
    [
      onUpdateExercises,
      exerciseID,
      setItem,
      patchCompleted,
      validateSet,
      onError,
    ]
  );

  const onChangeReps = useCallback(
    async (value) => {
      const clamped =
        value === ""
          ? ""
          : Math.max(SET_LIMITS.reps.min, Math.min(value, SET_LIMITS.reps.max));

      onUpdateExercises((prev) =>
        prev.map((item) => {
          if (item.id !== exerciseID) return item;
          const newSets = item.workout_sets.map((s) =>
            s.id === setItem.id
              ? { ...s, reps: clamped, completed: false, skipped: false }
              : s
          );

          return {
            ...item,
            workout_sets: newSets,
            completed: false,
          };
        })
      );

      if (setItem.completed || setItem.skipped) {
        try {
          await patchCompleted(false);
        } catch (error) {
          console.error("Error unchecking completed set:", error);
          onError(error);
        }
      }

      validateSet(
        { ...setItem, reps: clamped, completed: false, skipped: false },
        { isOnBlur: false }
      );
    },
    [
      onUpdateExercises,
      exerciseID,
      setItem,
      patchCompleted,
      validateSet,
      onError,
    ]
  );

  const handleBlur = useCallback(
    async ({ reps, weight }) => {
      const draft = { ...setItem, reps, weight };
      const { ok } = validateSet(draft, { isOnBlur: true });
      if (!ok) {
        return;
      }

      try {
        await patchSetFields({ reps: draft.reps, weight: draft.weight });
      } catch (error) {
        console.error("Error patching fields on blur:", error);
        onError(error);
      }
    },
    [setItem, validateSet, patchSetFields, onError]
  );

  const handleToggle = useCallback(
    async (e) => {
      const checked = e.target.checked;
      const { ok, errors } = validateSet(setItem, { isOnBlur: false });
      if (!ok) {
        setErrors(errors);
        alert(t("workout_plan_single.validation.please_check_fields"));
        return;
      }

      setErrors({});

      const optimisticUpdater = (prev) =>
        prev.map((item) => {
          if (item.id !== exerciseID) return item;
          const newSets = item.workout_sets.map((s) =>
            s.id === setItem.id
              ? { ...s, completed: checked, skipped: false }
              : s
          );
          const exerciseCompleted = newSets.every(
            (s) => s.completed || s.skipped
          );
          return {
            ...item,
            workout_sets: newSets,
            completed: exerciseCompleted,
          };
        });

      try {
        await withOptimisticUpdate(
          onUpdateExercises,
          optimisticUpdater,
          async () => {
            await api.patch(
              `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setItem.id}/update-complete`,
              { completed: checked }
            );
          }
        );
      } catch (error) {
        console.error("Error toggling sets:", error);
        onError(error);
      }
    },
    [
      onUpdateExercises,
      exerciseID,
      setItem.id,
      t,
      planID,
      cycleID,
      workoutID,
      onError,
      validateSet,
    ]
  );

  const renderSetDetailsMenu = useCallback(
    ({ close }) => (
      <WorkoutSetDetailsMenu
        planID={planID}
        cycleID={cycleID}
        workoutID={workoutID}
        setID={setItem.id}
        setIndex={setItem.index}
        setTemplate={{
          reps: setItem.reps,
          weight: setItem.weight,
          previous_weight: setItem.previous_weight,
          previous_reps: setItem.previous_reps,
        }}
        setCompleted={setItem.completed}
        setSkipped={setItem.skipped}
        setOrder={setOrder}
        exerciseID={exerciseID}
        updateExercises={onUpdateExercises}
        closeMenu={close}
        onError={onError}
      />
    ),
    [
      planID,
      cycleID,
      workoutID,
      setItem.id,
      setItem.index,
      setItem.reps,
      setItem.weight,
      setItem.previous_weight,
      setItem.previous_reps,
      setItem.completed,
      setItem.skipped,
      setOrder,
      exerciseID,
      onUpdateExercises,
      onError,
    ]
  );

  return (
    <div className="min-w-full grid grid-cols-[6dvw_minmax(20dvw,1fr)_minmax(20dvw,1fr)_minmax(0,6dvw)_1fr] sm:grid-cols-[36px_1fr_1fr_1fr_1fr_1fr] gap-4 items-center py-2">
      <DropdownMenu
        dotsHidden={!isCurrentCycle}
        isLeft
        menu={renderSetDetailsMenu}
      />
      <div className="hidden sm:block font-bold text-gray-600">
        {setItem.index}
      </div>

      <input
        type="number"
        placeholder={setItem.previous_weight ?? t("general.n_a")}
        value={setItem.weight ?? ""}
        step={0.1}
        min={SET_LIMITS.weight.min}
        max={SET_LIMITS.weight.max}
        inputMode="decimal"
        onFocus={() => setErrors((prev) => ({ ...prev, weight: "" }))}
        onBlur={() =>
          handleBlur({ reps: setItem.reps, weight: setItem.weight })
        }
        onChange={(e) => {
          const raw = toNumberOrEmpty(e.target.value);
          const next = raw === "" ? "" : Math.round(raw * 10) / 10;
          onChangeWeight(next);
        }}
        className={`input-style placeholder:italic 
          ${errors.weight ? "!border-2 !border-red-600" : ""}
        ${
          setItem.completed || setItem.skipped || !isCurrentCycle
            ? "opacity-40 cursor-not-allowed"
            : ""
        }`}
        disabled={!isCurrentCycle}
      />

      <input
        type="number"
        placeholder={setItem.previous_reps ?? t("general.n_a")}
        value={setItem.reps ?? ""}
        min={SET_LIMITS.reps.min}
        max={SET_LIMITS.reps.max}
        inputMode="numeric"
        step={1}
        onFocus={() => setErrors((prev) => ({ ...prev, reps: "" }))}
        onBlur={() =>
          handleBlur({ reps: setItem.reps, weight: setItem.weight })
        }
        onChange={(e) => {
          const raw = toNumberOrEmpty(e.target.value);
          const next = raw === "" ? "" : Math.round(raw);
          onChangeReps(next);
        }}
        className={`input-style placeholder:italic
          ${errors.reps ? "!border-2 !border-red-600" : ""}
         ${
           setItem.completed || setItem.skipped || !isCurrentCycle
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
        checked={!!setItem.completed || !!setItem.skipped}
        onChange={handleToggle}
        disabled={!isCurrentCycle}
        customIcon={setItem.skipped && <ChartEqualIcon />}
      />
    </div>
  );
};

export default memo(WorkoutSetRow);

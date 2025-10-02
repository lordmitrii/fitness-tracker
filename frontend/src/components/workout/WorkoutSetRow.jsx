import { memo, useCallback, useState, useRef, useEffect } from "react";
import DropdownMenu from "../DropdownMenu";
import WorkoutSetDetailsMenu from "./WorkoutSetDetailsMenu";
import CheckBox from "../CheckBox";
import { getExerciseProgressBadge } from "../../utils/exerciseUtils";
import { useTranslation } from "react-i18next";
import {
  toNumberOrEmpty,
  toNullIfEmpty,
  toDisplayWeight,
  fromDisplayWeight,
  displayWeightMax,
  displayWeightMin,
} from "../../utils/numberUtils";
import { SET_LIMITS } from "../../config/constants";
import { ChartEqualIcon } from "../../icons/ChartIcon";
import useCycleData from "../../hooks/data/useCycleData";

const WorkoutSetRow = ({
  planID,
  cycleID,
  workoutID,
  exerciseID,
  setItem,
  setOrder,
  isCurrentCycle,
  unitSystem = "metric",
}) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState({});
  const { mutations, ui } = useCycleData({
    planID,
    cycleID,
    skipQuery: true,
  });

  const lastSavedRef = useRef({
    reps: toNullIfEmpty(setItem?.reps),
    weight: toNullIfEmpty(setItem?.weight),
  });

  useEffect(() => {
    lastSavedRef.current = {
      reps: toNullIfEmpty(setItem?.reps),
      weight: toNullIfEmpty(setItem?.weight),
    };
  }, [setItem.id]);

  const validateSet = useCallback(
    (setItem, { softCheck = false } = {}) => {
      const errors = {};
      if (setItem.skipped) return { ok: true, errors };
      if (
        setItem.reps === "" ||
        setItem.reps === null ||
        setItem.reps === undefined
      ) {
        if (!softCheck)
          errors.reps = t("workout_plan_single.validation.reps_required");
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

      if (
        setItem.weight === "" ||
        setItem.weight === null ||
        setItem.weight === undefined
      ) {
        if (!softCheck)
          errors.weight = t("workout_plan_single.validation.weight_required");
      } else if (!Number.isFinite(setItem.weight)) {
        errors.weight = t("workout_plan_single.validation.weight_number");
      } else if (
        setItem.weight < SET_LIMITS.weight.min ||
        setItem.weight > SET_LIMITS.weight.max
      ) {
        errors.weight = t("workout_plan_single.validation.weight_range", {
          min: displayWeightMin(SET_LIMITS.weight.min, unitSystem, 2),
          max: displayWeightMax(SET_LIMITS.weight.max, unitSystem, 2),
          unit: unitSystem === "imperial" ? t("measurements.weight_lb") : t("measurements.weight_kg"),
        });
      }

      return { ok: Object.keys(errors).length === 0, errors };
    },
    [t, unitSystem]
  );

  // Send patch request for set fields
  const patchSetFields = useCallback(
    async ({ reps, weight }) => {
      await mutations.updateSetFields.mutateAsync({
        workoutID,
        exerciseID,
        setID: setItem.id,
        reps: toNullIfEmpty(reps),
        weight: toNullIfEmpty(weight),
        skipped: false,
        completed: false,
      });
      lastSavedRef.current = {
        reps: toNullIfEmpty(reps),
        weight: toNullIfEmpty(weight),
      };
    },
    [exerciseID, setItem.id, workoutID, mutations.updateSetFields]
  );

  // Send patch request for completed status
  const patchCompleted = useCallback(
    async ({ completed, skipped }) => {
      await mutations.toggleSetCompleted.mutateAsync({
        workoutID,
        exerciseID,
        setID: setItem.id,
        completed,
        skipped,
      });
    },
    [exerciseID, setItem.id, workoutID, mutations.toggleSetCompleted]
  );

  // This should do soft checks on every change, set exercises as not completed (send request as well) but value change will be handled on blur only
  const onChangeWeight = useCallback(
    async (value) => {
      const clamped =
        value === ""
          ? ""
          : Math.max(
              SET_LIMITS.weight.min,
              Math.min(value, SET_LIMITS.weight.max)
            );

      if (setItem.completed || setItem.skipped) {
        try {
          await patchCompleted({ completed: false, skipped: false });
        } catch (error) {
          console.error("Error unchecking completed set:", error);
        }
      }

      validateSet(
        { ...setItem, weight: clamped, completed: false, skipped: false },
        { softCheck: true }
      );
      ui.patchSetFieldsUI({
        workoutID,
        exerciseID,
        setID: setItem.id,
        weight: clamped,
        reps: setItem.reps,
        completed: false,
        skipped: false,
      });
    },
    [setItem, patchCompleted, validateSet, ui.patchSetFieldsUI]
  );

  // Same here
  const onChangeReps = useCallback(
    async (value) => {
      const clamped =
        value === ""
          ? ""
          : Math.max(SET_LIMITS.reps.min, Math.min(value, SET_LIMITS.reps.max));

      if (setItem.completed || setItem.skipped) {
        try {
          await patchCompleted({ completed: false, skipped: false });
        } catch (error) {
          console.error("Error unchecking completed set:", error);
        }
      }

      validateSet(
        { ...setItem, reps: clamped, completed: false, skipped: false },
        { softCheck: true }
      );
      ui.patchSetFieldsUI({
        workoutID,
        exerciseID,
        setID: setItem.id,
        weight: setItem.weight,
        reps: clamped,
        completed: false,
        skipped: false,
      });
    },
    [setItem, patchCompleted, validateSet, ui.patchSetFieldsUI]
  );

  // Should do a soft check on errors and send patch to backend with updated fields (this shouldn't toggle completed if value hasn't changed)
  const handleBlur = useCallback(async () => {
    const { ok, errors } = validateSet({ ...setItem }, { softCheck: true });
    if (!ok) {
      setErrors(errors);
      return;
    }

    const next = {
      reps: toNullIfEmpty(setItem.reps),
      weight: toNullIfEmpty(setItem.weight),
    };
    const prev = lastSavedRef.current;

    const hasChanged = next.reps !== prev.reps || next.weight !== prev.weight;

    if (!hasChanged) return;

    setErrors({});

    try {
      await patchSetFields({ reps: setItem.reps, weight: setItem.weight });
    } catch (error) {
      console.error("Error patching fields on blur:", error);
    }
  }, [setItem, validateSet, patchSetFields]);

  // Can be checked only if passes hard checks and sends patch request to backend to complete set
  // Can also be unchecked without validation and sends patch request to backend to uncomplete set
  const handleToggle = useCallback(
    async (e) => {
      const checked = e.target.checked;
      if (checked) {
        const { ok, errors } = validateSet(setItem, { softCheck: false });
        if (!ok) {
          setErrors(errors);
          alert(t("workout_plan_single.validation.please_check_fields"));
          return;
        }
      }
      setErrors({});
      try {
        await patchCompleted({ completed: checked, skipped: false });
      } catch (error) {
        console.error("Error toggling sets:", error);
      }
    },
    [t, setItem, patchCompleted, validateSet]
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
        closeMenu={close}
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
    ]
  );

  return (
    <div title={`Set n${setItem.index} (id: ${setItem.id})`} className="min-w-full grid grid-cols-[6dvw_minmax(20dvw,1fr)_minmax(20dvw,1fr)_minmax(0,6dvw)_1fr] sm:grid-cols-[36px_1fr_1fr_1fr_1fr_1fr] gap-4 items-center py-2">
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
        placeholder={
          toDisplayWeight(setItem.previous_weight, unitSystem, 2) ||
          t("general.n_a")
        }
        value={toDisplayWeight(setItem.weight, unitSystem, 2)}
        step={0.01}
        min={displayWeightMin(SET_LIMITS.weight.min, unitSystem, 2)}
        max={displayWeightMax(SET_LIMITS.weight.max, unitSystem, 2)}
        inputMode="decimal"
        autoComplete="off"
        onFocus={() => setErrors((prev) => ({ ...prev, weight: "" }))}
        onBlur={handleBlur}
        onChange={(e) => {
          const raw = toNumberOrEmpty(e.target.value);
          const next = raw === "" ? "" : Math.round(raw * 100) / 100;
          const nextBase = fromDisplayWeight(next, unitSystem);
          onChangeWeight(nextBase);
        }}
        className={`input-style placeholder:italic 
            ${errors.weight ? "!border-2 !border-red-600" : ""}
            ${
              setItem.completed || setItem.skipped || !isCurrentCycle
                ? "opacity-40 cursor-not-allowed"
                : ""
            }
          `}
        disabled={!isCurrentCycle}
      />

      <input
        type="number"
        placeholder={setItem.previous_reps ?? t("general.n_a")}
        value={setItem.reps ?? ""}
        min={SET_LIMITS.reps.min}
        max={SET_LIMITS.reps.max}
        inputMode="numeric"
        autoComplete="off"
        step={1}
        onFocus={() => setErrors((prev) => ({ ...prev, reps: "" }))}
        onBlur={handleBlur}
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
            }
          `}
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

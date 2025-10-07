import { memo, useCallback, useState, useRef, useEffect } from "react";
import DropdownMenu from "../DropdownMenu";
import WorkoutSetDetailsMenu from "./WorkoutSetDetailsMenu";
import CheckBox from "../CheckBox";
import { getExerciseProgressBadge } from "../../utils/exerciseUtils";
import { useTranslation } from "react-i18next";
import {
  toNumOrNull,
  toNullIfEmpty,
  toDisplayWeight,
  fromDisplayWeight,
  displayWeightMax,
  displayWeightMin,
  INTEGER_INPUT_RE,
  DECIMAL_INPUT_RE,
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

  const [weightDraft, setWeightDraft] = useState(() =>
    (toDisplayWeight(setItem.weight, unitSystem, 2) ?? "").toString()
  );
  const [repsDraft, setRepsDraft] = useState(() =>
    (setItem.reps ?? "").toString()
  );

  useEffect(() => {
    setWeightDraft(
      (toDisplayWeight(setItem.weight, unitSystem, 2) ?? "").toString()
    );
  }, [setItem.weight, unitSystem]);

  useEffect(() => {
    setRepsDraft((setItem.reps ?? "").toString());
  }, [setItem.reps]);

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
          unit:
            unitSystem === "imperial"
              ? t("measurements.weight_lb")
              : t("measurements.weight_kg"),
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

  const commitWeight = useCallback(async () => {
    const num = toNumOrNull(weightDraft);
    const rounded = num == null ? "" : Math.round(num * 100) / 100;
    const base = rounded === "" ? "" : fromDisplayWeight(rounded, unitSystem);
    const clampedBase =
      base === ""
        ? ""
        : Math.max(
            SET_LIMITS.weight.min,
            Math.min(base, SET_LIMITS.weight.max)
          );

    const prev = lastSavedRef.current?.weight ?? null;
    const next = toNullIfEmpty(clampedBase);
    if (prev === next) {
      setWeightDraft(
        (toDisplayWeight(clampedBase, unitSystem, 2) ?? "").toString()
      );
      return;
    }

    const candidate = {
      ...setItem,
      weight: clampedBase,
      completed: false,
      skipped: false,
    };
    const { ok, errors: es } = validateSet(candidate, { softCheck: true }); // soft here; hard happens on complete toggle
    if (!ok) {
      setErrors((prev) => ({ ...prev, ...es }));
      return;
    }

    ui.patchSetFieldsUI({
      workoutID,
      exerciseID,
      setID: setItem.id,
      weight: clampedBase,
      reps: setItem.reps,
      completed: false,
      skipped: false,
    });

    try {
      await patchSetFields({ reps: setItem.reps, weight: clampedBase });
      setErrors((prev) => ({ ...prev, weight: "" }));
      setWeightDraft(
        (toDisplayWeight(clampedBase, unitSystem, 2) ?? "").toString()
      );
    } catch (err) {
      console.error("Error patching weight:", err);
    }
  }, [
    weightDraft,
    unitSystem,
    setItem,
    ui,
    patchSetFields,
    workoutID,
    exerciseID,
    validateSet,
  ]);

  const commitReps = useCallback(async () => {
    const num = toNumOrNull(repsDraft);
    const intVal = num == null ? "" : Math.round(num);

    const clamped =
      intVal === ""
        ? ""
        : Math.max(SET_LIMITS.reps.min, Math.min(intVal, SET_LIMITS.reps.max));

    const prev = lastSavedRef.current?.reps ?? null;
    const next = toNullIfEmpty(clamped);
    if (prev === next) {
      setRepsDraft((clamped ?? "").toString());
      return;
    }

    const candidate = {
      ...setItem,
      reps: clamped,
      completed: false,
      skipped: false,
    };
    const { ok, errors: es } = validateSet(candidate, { softCheck: true });
    if (!ok) {
      setErrors((prev) => ({ ...prev, ...es }));
      return;
    }

    ui.patchSetFieldsUI({
      workoutID,
      exerciseID,
      setID: setItem.id,
      weight: setItem.weight,
      reps: clamped,
      completed: false,
      skipped: false,
    });

    try {
      await patchSetFields({ reps: clamped, weight: setItem.weight });
      setErrors((prev) => ({ ...prev, reps: "" }));
      setRepsDraft((clamped ?? "").toString());
    } catch (err) {
      console.error("Error patching reps:", err);
    }
  }, [
    repsDraft,
    setItem,
    ui,
    patchSetFields,
    workoutID,
    exerciseID,
    validateSet,
  ]);

  const handleToggle = useCallback(
    async (e) => {
      const checked = e.target.checked;

      if (checked) {
        const weightNum = toNumOrNull(weightDraft);
        const weightRounded =
          weightNum == null ? "" : Math.round(weightNum * 100) / 100;
        const weightBase =
          weightRounded === ""
            ? ""
            : fromDisplayWeight(weightRounded, unitSystem);

        const repsNum = toNumOrNull(repsDraft);
        const repsRounded = repsNum == null ? "" : Math.round(repsNum);

        const candidate = {
          ...setItem,
          weight: weightBase === "" ? "" : weightBase,
          reps: repsRounded === "" ? "" : repsRounded,
          completed: true,
          skipped: false,
        };

        const { ok, errors } = validateSet(candidate, { softCheck: false });
        if (!ok) {
          setErrors(errors);
          alert(t("workout_plan_single.validation.please_check_fields"));
          return;
        }

        await commitReps();
        await commitWeight();
      }
      setErrors({});
      try {
        await patchCompleted({ completed: checked, skipped: false });
      } catch (error) {
        console.error("Error toggling sets:", error);
      }
    },
    [
      t,
      setItem,
      patchCompleted,
      validateSet,
      weightDraft,
      repsDraft,
      unitSystem,
      commitReps,
      commitWeight,
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
    <div
      title={`Set n${setItem.index} (id: ${setItem.id})`}
      className="min-w-full grid grid-cols-[6dvw_minmax(20dvw,1fr)_minmax(20dvw,1fr)_minmax(0,6dvw)_1fr] sm:grid-cols-[36px_1fr_1fr_1fr_1fr_1fr] gap-4 items-center py-2"
    >
      <DropdownMenu
        dotsHidden={!isCurrentCycle}
        isLeft
        menu={renderSetDetailsMenu}
      />
      <div className="hidden sm:block font-bold text-gray-600">
        {setItem.index}
      </div>

      <input
        type="text"
        inputMode="decimal"
        placeholder={
          toDisplayWeight(setItem.previous_weight, unitSystem, 2) ||
          t("general.n_a")
        }
        value={weightDraft}
        autoComplete="off"
        onFocus={() => setErrors((prev) => ({ ...prev, weight: "" }))}
        onChange={async (e) => {
          const v = e.target.value;
          if (!DECIMAL_INPUT_RE.test(v)) return;
          setWeightDraft(v);

          if (setItem.completed || setItem.skipped) {
            try {
              await patchCompleted({ completed: false, skipped: false });
            } catch (err) {
              console.error(err);
            }
          }

          const num = toNumOrNull(v);
          const rounded = num == null ? "" : Math.round(num * 100) / 100;
          const base =
            rounded === "" ? "" : fromDisplayWeight(rounded, unitSystem);
          validateSet(
            {
              ...setItem,
              weight: base === "" ? "" : base,
              completed: false,
              skipped: false,
            },
            { softCheck: true }
          );
        }}
        onBlur={commitWeight}
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
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={setItem.previous_reps ?? t("general.n_a")}
        value={repsDraft}
        onFocus={() => setErrors((prev) => ({ ...prev, reps: "" }))}
        onChange={async (e) => {
          const v = e.target.value;
          if (!INTEGER_INPUT_RE.test(v)) return;
          setRepsDraft(v);

          if (setItem.completed || setItem.skipped) {
            try {
              await patchCompleted({ completed: false, skipped: false });
            } catch (err) {
              console.error(err);
            }
          }

          const num = toNumOrNull(v);
          const rounded = num == null ? "" : Math.round(num);
          validateSet(
            {
              ...setItem,
              reps: rounded === "" ? "" : rounded,
              completed: false,
              skipped: false,
            },
            { softCheck: true }
          );
        }}
        onBlur={commitReps}
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

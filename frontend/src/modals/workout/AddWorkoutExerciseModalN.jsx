import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import api from "../../api";
import { cloneElement } from "react";
import SpinnerIcon from "../../icons/SpinnerIcon";
import { useTranslation } from "react-i18next";
import CheckBox from "../../components/CheckBox";
import useScrollLock from "../../hooks/useScrollLock";
import useExercisesData from "../../hooks/useExercisesData";
import { toNumberOrEmpty } from "../../utils/numberUtils";

function MuscleGroupSelect({ t, muscleGroups, value, onChange, required }) {
  return (
    <>
      <select
        className="input-style"
        value={value}
        onChange={(e) => onChange(toNumberOrEmpty(e.target.value))}
        required={required}
      >
        <option value="">
          {required
            ? t("add_workout_exercise_modal.select_muscle_group")
            : t("add_workout_exercise_modal.all_muscle_groups")}
        </option>
        {muscleGroups.map((group) => (
          <option key={group.id} value={group.id}>
            {t(`muscle_group.${group.slug}`)}
          </option>
        ))}
      </select>
    </>
  );
}

function ExerciseSelect({
  t,
  exercises,
  muscleGroupID,
  value,
  onChange,
  error,
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const items = useMemo(() => {
    const byGroup = muscleGroupID
      ? exercises.filter((ex) => ex.muscle_group_id === muscleGroupID)
      : exercises;

    const q = query.trim().toLowerCase();
    const filtered = !q
      ? byGroup
      : byGroup.filter((ex) => {
          const name = (ex.name || "").toLowerCase();
          const translated = ex.slug
            ? String(t(`exercise.${ex.slug}`)).toLowerCase()
            : "";
          return name.includes(q) || translated.includes(q);
        });

    // keep it snappy if there are many
    return filtered.slice(0, 200);
  }, [exercises, muscleGroupID, query, t]);

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    const ex = exercises.find((e) => `${e.source}-${e.id}` === value);
    if (!ex) return "";
    const base = ex.slug ? t(`exercise.${ex.slug}`) : ex.name;
    const suffix =
      ex.source === "custom"
        ? ` ${t("add_workout_exercise_modal.custom_suffix")}`
        : "";
    return `${base}${suffix}`;
  }, [value, exercises, t]);

  // close dropdown on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  // keep highlighted row in view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${highlight}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const commitSelection = useCallback(
    (idx) => {
      const ex = items[idx];
      if (!ex) return;
      onChange(`${ex.source}-${ex.id}`);
      setQuery("");
      setOpen(false);
      // move focus back to input for quick “sets” entry
      inputRef.current?.focus();
    },
    [items, onChange]
  );

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open) commitSelection(highlight);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // simple match highlighter
  const renderLabel = (ex) => {
    const base = ex.slug ? t(`exercise.${ex.slug}`) : ex.name;
    const suffix =
      ex.source === "custom"
        ? ` ${t("add_workout_exercise_modal.custom_suffix")}`
        : "";
    if (!query.trim()) return base + suffix;

    const q = query.trim().toLowerCase();
    const idx = base.toLowerCase().indexOf(q);
    if (idx === -1) return base + suffix;

    return (
      <>
        {base.slice(0, idx)}
        <mark className="bg-yellow-100">{base.slice(idx, idx + q.length)}</mark>
        {base.slice(idx + q.length)}
        {suffix}
      </>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        className="input-style"
        type="text"
        value={query || selectedLabel}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
          // clear selected value when user starts typing a fresh query
          if (value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={`${t("add_workout_exercise_modal.select_exercise")}…`}
      />

      {open && (
        <ul
          id="exercise-combobox-list"
          ref={listRef}
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {items.length === 0 ? (
            <li className="px-3 py-2 text-gray-400 text-caption">
              {t("add_workout_exercise_modal.select_exercise")}
            </li>
          ) : (
            items.map((ex, idx) => (
              <li
                key={`${ex.source}-${ex.id}`}
                id={`exercise-opt-${idx}`}
                data-index={idx}
                className={`px-3 py-2 cursor-pointer ${
                  idx === highlight ? "bg-gray-100" : ""
                }`}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => {
                  // prevent input blur before click fires
                  e.preventDefault();
                  commitSelection(idx);
                }}
              >
                {renderLabel(ex)}
              </li>
            ))
          )}
        </ul>
      )}

      {error && <p className="text-caption-red mt-1">{error}</p>}
    </div>
  );
}

function CustomExerciseFields({
  t,
  name,
  setName,
  isBodyweight,
  setIsBodyweight,
  isTimeBased,
  setIsTimeBased,
  nameError,
}) {
  return (
    <>
      <input
        className="input-style"
        type="text"
        placeholder={t("add_workout_exercise_modal.exercise_name_placeholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      {nameError && <p className="text-caption-red mt-1">{nameError}</p>}

      <div className="flex justify-between align-center gap-6">
        <span className="flex items-center text-caption gap-2">
          <span>{t("add_workout_exercise_modal.is_bodyweight")}</span>
          <CheckBox
            title={t("workout_plan_single.is_bodyweight")}
            checked={isBodyweight}
            onChange={(e) => setIsBodyweight(e.target.checked)}
          />
        </span>
        <span className="flex items-center text-caption gap-2">
          <span>{t("add_workout_exercise_modal.is_time_based")}</span>
          <CheckBox
            title={t("workout_plan_single.set_completed")}
            checked={isTimeBased}
            onChange={(e) => setIsTimeBased(e.target.checked)}
          />
        </span>
      </div>
    </>
  );
}

function SetsField({ t, value, onChange, error }) {
  return (
    <>
      <input
        className="input-style"
        type="number"
        placeholder={
          t("measurements.sets")[0].toUpperCase() +
          t("measurements.sets").slice(1)
        }
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={1}
        required
      />
      {error && <p className="text-caption-red mt-1">{error}</p>}
    </>
  );
}

const AddWorkoutExerciseModal = ({
  open: openProp,
  onOpenChange,
  trigger,
  workoutID,
  workoutName,
  planID,
  cycleID,
  replaceExerciseID,
  onUpdateExercises,
  onError,
  buttonText,
  dummyMode = false,
}) => {
  const { t } = useTranslation();

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined && onOpenChange;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const modalRef = useRef(null);
  const triggerRef = useRef(null);

  useScrollLock(open);

  const { exercises, muscleGroups, loading, fetchedOnce, resetForNextOpen } =
    useExercisesData(open, onError);

  const [makingCustomExercise, setMakingCustomExercise] = useState(false);
  const [exerciseID, setExerciseID] = useState("");
  const [name, setName] = useState("");
  const [muscleGroupID, setMuscleGroupID] = useState("");
  const [sets, setSets] = useState("");
  const [isBodyweight, setIsBodyweight] = useState(false);
  const [isTimeBased, setIsTimeBased] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Restore focus to trigger after close (nice for keyboard users)
  useEffect(() => {
    if (!open && triggerRef.current) {
      try {
        triggerRef.current.focus();
      } catch {}
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setExerciseID("");
      setName("");
      setIsBodyweight(false);
      setIsTimeBased(false);
      setMuscleGroupID("");
      setSets("");
      setFormErrors({});
    }
  }, [open, workoutID, makingCustomExercise]);

  // Ensure we revert the toggle when closing
  useEffect(() => {
    if (!open) setMakingCustomExercise(false);
  }, [open]);

  // Validation
  const validate = useCallback(() => {
    const newErrors = {};
    if (makingCustomExercise) {
      const trimmed = name.trim();
      if (!trimmed)
        newErrors.name = t("add_workout_exercise_modal.name_required");
      if (!muscleGroupID)
        newErrors.muscleGroupID = t(
          "add_workout_exercise_modal.muscle_group_required"
        );
      const setsNum = Number(sets);
      if (!Number.isFinite(setsNum) || setsNum < 1)
        newErrors.sets = t("add_workout_exercise_modal.sets_required");
      const dup = exercises.find(
        (ex) => (ex.name || "").trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (dup)
        newErrors.name = t(
          "add_workout_exercise_modal.exercise_already_exists"
        );
    } else {
      if (!exerciseID)
        newErrors.exerciseID = t(
          "add_workout_exercise_modal.exercise_required"
        );
      const setsNum = Number(sets);
      if (!Number.isFinite(setsNum) || setsNum < 1)
        newErrors.sets = t("add_workout_exercise_modal.sets_required");
    }
    return newErrors;
  }, [makingCustomExercise, name, muscleGroupID, sets, exercises, t]);

  const handleSaveNewExercise = useCallback(
    async (newExercise, setsQt) => {
      try {
        const setsNum = Number(setsQt);
        const { data: individualExercise } = await api.post(
          "individual-exercises",
          {
            exercise_id: newExercise.id,
            name: newExercise.name,
            muscle_group_id: newExercise.muscle_group_id,
            is_bodyweight: newExercise.is_bodyweight,
            is_time_based: newExercise.is_time_based,
          }
        );

        const workoutPath = `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`;
        const { data: workoutExercise } = !dummyMode
          ? replaceExerciseID
            ? await api.post(
                `${workoutPath}/workout-exercises/${replaceExerciseID}/replace`,
                {
                  individual_exercise_id: individualExercise.id,
                  sets_qt: setsNum,
                }
              )
            : await api.post(`${workoutPath}/workout-exercises`, {
                individual_exercise_id: individualExercise.id,
                sets_qt: setsNum,
              })
          : {
              data: {
                individual_exercise_id: individualExercise.id,
                sets_qt: setsNum,
                workoutID: workoutID,
              },
            };

        individualExercise.muscle_group = muscleGroups.find(
          (group) => group.id === individualExercise.muscle_group_id
        );

        individualExercise.exercise = exercises.find(
          (ex) => ex.id === individualExercise.exercise_id
        );

        onUpdateExercises((prev) => {
          if (!replaceExerciseID)
            return [
              ...prev,
              { ...workoutExercise, individual_exercise: individualExercise },
            ];

          const old = prev.find((e) => e.id === replaceExerciseID);
          const idx = old?.index;
          return prev.map((ex) =>
            ex.id === replaceExerciseID
              ? {
                  ...workoutExercise,
                  individual_exercise: individualExercise,
                  index: idx,
                }
              : ex
          );
        });

        close();
      } catch (error) {
        console.error("Error saving new exercise:", error);
        onError(error);
      }
    },
    [
      planID,
      cycleID,
      workoutID,
      dummyMode,
      replaceExerciseID,
      exercises,
      muscleGroups,
      onUpdateExercises,
      onError,
      close,
    ]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setFormErrors(errs);
        return;
      }

      // quick UI lock via disabled submit; no global overlay unless network fetch in hook
      let source, id;
      if (exerciseID) [source, id] = String(exerciseID).split("-");

      if (makingCustomExercise) {
        await handleSaveNewExercise(
          {
            name: name.trim(),
            muscle_group_id: muscleGroupID,
            is_bodyweight: isBodyweight,
            is_time_based: isTimeBased,
          },
          sets
        );
        // refetch on next open so the new custom is in the list
        resetForNextOpen();
        return;
      }

      const exObj = exercises.find(
        (ex) => `${ex.source}-${ex.id}` === exerciseID
      );
      if (!exObj) {
        console.error("Selected exercise not found in the list: ", exerciseID);
        onError(new Error("Selected exercise not found in the list."));
        return;
      }

      if (source === "pool") {
        await handleSaveNewExercise(
          {
            id: exObj.id,
            is_bodyweight: exObj.is_bodyweight,
            is_time_based: exObj.is_time_based,
          },
          sets
        );
      } else {
        await handleSaveNewExercise(
          {
            name: exObj.name,
            muscle_group_id: exObj.muscle_group_id,
            is_bodyweight: exObj.is_bodyweight,
            is_time_based: exObj.is_time_based,
          },
          sets
        );
      }
    },
    [
      validate,
      exerciseID,
      makingCustomExercise,
      handleSaveNewExercise,
      name,
      muscleGroupID,
      isBodyweight,
      isTimeBased,
      sets,
      exercises,
      onError,
      resetForNextOpen,
    ]
  );

  useEffect(() => {
    function handleClick(e) {
      if (open && modalRef.current && !modalRef.current.contains(e.target)) {
        close();
      }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open, close, modalRef]);

  return (
    <>
      {trigger
        ? cloneElement(trigger, {
            onClick: () => setOpen(true),
            ref: triggerRef,
          })
        : null}
      {open && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex justify-center items-center z-50">
          <div
            ref={modalRef}
            className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-3xl mx-2"
          >
            {loading && !fetchedOnce && (
              <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center z-10 rounded-2xl">
                <span className="inline-flex items-center justify-center bg-blue-50 rounded-full p-4">
                  <SpinnerIcon />
                </span>
              </div>
            )}

            <h1 className="text-body font-semibold mb-4">
              {buttonText || t("general.add")}{" "}
              {t("add_workout_exercise_modal.exercise_title")}{" "}
              {!replaceExerciseID && `${t("general.to")} ${workoutName}`}
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <MuscleGroupSelect
                t={t}
                muscleGroups={muscleGroups}
                value={muscleGroupID}
                onChange={setMuscleGroupID}
                required={makingCustomExercise}
              />
              {formErrors.muscleGroupID && (
                <p className="text-caption-red mt-1">
                  {formErrors.muscleGroupID}
                </p>
              )}

              {!makingCustomExercise ? (
                <ExerciseSelect
                  t={t}
                  exercises={exercises}
                  muscleGroupID={muscleGroupID}
                  value={exerciseID}
                  onChange={setExerciseID}
                  error={formErrors.exerciseID}
                />
              ) : (
                <CustomExerciseFields
                  t={t}
                  name={name}
                  setName={setName}
                  isBodyweight={isBodyweight}
                  setIsBodyweight={setIsBodyweight}
                  isTimeBased={isTimeBased}
                  setIsTimeBased={setIsTimeBased}
                  nameError={formErrors.name}
                />
              )}

              <SetsField
                t={t}
                value={sets}
                onChange={setSets}
                error={formErrors.sets}
              />

              <button
                type="button"
                className="text-caption-blue hover:underline mb-2"
                onClick={() => setMakingCustomExercise((v) => !v)}
              >
                {!makingCustomExercise
                  ? t("add_workout_exercise_modal.create_custom_exercise")
                  : t("add_workout_exercise_modal.select_from_exercise_pool")}
              </button>

              <div className="flex gap-2 justify-between mt-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={close}
                >
                  {t("general.cancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? t("general.loading")
                    : buttonText ?? t("general.add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddWorkoutExerciseModal;

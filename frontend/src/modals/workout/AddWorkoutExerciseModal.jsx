import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import SpinnerIcon from "../../icons/SpinnerIcon";
import { useTranslation } from "react-i18next";
import CheckBox from "../../components/CheckBox";
import useExercisesData from "../../hooks/useExercisesData";
import Modal from "../Modal";
import MuscleGroupSelect from "../../components/workout/MuscleGroupSelect";
import ExerciseSelect from "../../components/workout/ExerciseSelect";
import { MAX_SET_QT } from "../../config/constants";

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
        maxLength={50}
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
        step={1}
        required
      />
      {error && <p className="text-caption-red mt-1">{error}</p>}
    </>
  );
}

const AddWorkoutExerciseModal = ({
  workoutID,
  workoutName,
  planID,
  cycleID,
  replaceExerciseID,
  onUpdateExercises,
  onError,
  dummyMode = false,
  onClose,
}) => {
  const { t } = useTranslation();
  const [openWhich, setOpenWhich] = useState("none"); // "none" | "exercise" | "muscle"
  const [submitting, setSubmitting] = useState(false);

  const {
    exercises,
    muscleGroups,
    loading,
    fetchedOnce,
    mutations, // { createIndividualExercise, attachWorkoutExercise }
  } = useExercisesData(onError);

  const [makingCustomExercise, setMakingCustomExercise] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [name, setName] = useState("");
  const [muscleGroupID, setMuscleGroupID] = useState(null);
  const [sets, setSets] = useState("");
  const [isBodyweight, setIsBodyweight] = useState(false);
  const [isTimeBased, setIsTimeBased] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const prevMuscleGroupRef = useRef(muscleGroupID);

  useEffect(() => {
    if (prevMuscleGroupRef.current !== muscleGroupID) {
      setSelectedExercise(null);
      setFormErrors((e) => ({ ...e, exerciseID: null }));
    }
    prevMuscleGroupRef.current = muscleGroupID;
  }, [muscleGroupID]);

  useEffect(() => {
    setSelectedExercise(null);
    setName("");
    setIsBodyweight(false);
    setIsTimeBased(false);
    setMuscleGroupID(null);
    setSets("");
    setFormErrors({});
    setOpenWhich("none");
    setMakingCustomExercise(false);
  }, [workoutID]);

  useEffect(() => {
    if (makingCustomExercise) setSelectedExercise(null);
    else setName("");
  }, [makingCustomExercise]);

  const exercisesL10n = useMemo(() => {
    return exercises.map((ex) => {
      const base = ex.slug ? t(`exercise.${ex.slug}`) : ex.name || "";
      const suffix =
        ex.source === "custom"
          ? ` ${t("add_workout_exercise_modal.custom_suffix")}`
          : "";
      const label = base + suffix;
      return {
        ...ex,
        _label: label,
        _labelLower: label.toLowerCase(),
        _nameLower: (ex.name || "").toLowerCase(),
      };
    });
  }, [exercises, t]);

  const muscleGroupsL10n = useMemo(() => {
    return muscleGroups.map((g) => {
      const label = g.slug ? t(`muscle_group.${g.slug}`) : g.name;
      return { ...g, _label: label, _labelLower: label.toLowerCase() };
    });
  }, [muscleGroups, t]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (makingCustomExercise) {
      const trimmed = name.trim();
      if (!trimmed)
        newErrors.name = t("add_workout_exercise_modal.name_required");
      else if (trimmed.length > 50)
        newErrors.name = t("general.name_too_long", {
          limit: 50,
        });
      if (!muscleGroupID)
        newErrors.muscleGroupID = t(
          "add_workout_exercise_modal.muscle_group_required"
        );
      const dup = exercises.find(
        (ex) => (ex.name || "").trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (dup)
        newErrors.name = t(
          "add_workout_exercise_modal.exercise_already_exists"
        );
    } else {
      if (!selectedExercise)
        newErrors.exerciseID = t(
          "add_workout_exercise_modal.exercise_required"
        );
    }
    const setsNum = Number.parseInt(String(sets), 10);
    if (!Number.isInteger(setsNum) || setsNum < 1)
      newErrors.sets = t("add_workout_exercise_modal.sets_required");
    else if (setsNum > MAX_SET_QT)
      newErrors.sets = t("add_workout_exercise_modal.sets_limit_exceeded", {
        limit: MAX_SET_QT,
      });
    return newErrors;
  }, [
    makingCustomExercise,
    name,
    muscleGroupID,
    sets,
    exercises,
    t,
    selectedExercise,
  ]);

  const submittingNow =
    submitting ||
    mutations.createIndividualExercise.isPending ||
    mutations.attachWorkoutExercise.isPending;

  const handleSaveNewExercise = useCallback(
    async (newExercise, setsQt) => {
      try {
        const setsNum = Number(setsQt);

        // Create/resolve individual exercise
        const individualExercise =
          await mutations.createIndividualExercise.mutateAsync({
            exercise_id: newExercise.id, // if from pool
            name: newExercise.name, // if custom
            muscle_group_id: newExercise.muscle_group_id,
            is_bodyweight: newExercise.is_bodyweight,
            is_time_based: newExercise.is_time_based,
          });

        //  Attach to workout (or replace)
        let workoutExercise;
        if (!dummyMode) {
          workoutExercise = await mutations.attachWorkoutExercise.mutateAsync({
            planID,
            cycleID,
            workoutID,
            replaceExerciseID,
            individual_exercise_id: individualExercise.id,
            sets_qt: setsNum,
          });
        } else {
          workoutExercise = {
            individual_exercise_id: individualExercise.id,
            sets_qt: setsNum,
            workoutID,
          };
        }

        // 3 Update exercises in parent component
        individualExercise.muscle_group = muscleGroups.find(
          (group) => group.id === individualExercise.muscle_group_id
        );
        individualExercise.exercise = exercises.find(
          (ex) =>
            ex.id === individualExercise.exercise_id && ex.source === "pool"
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

        onClose?.();
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
      onClose,
      mutations.createIndividualExercise,
      mutations.attachWorkoutExercise,
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

      setSubmitting(true);
      try {
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
          return;
        }

        const { source, id } = selectedExercise;
        const exObj = exercises.find(
          (ex) => ex.source === source && ex.id === id
        );
        if (!exObj) {
          console.error(
            "Selected exercise not found in the list: ",
            selectedExercise
          );
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
      } catch (error) {
        console.error("Error saving new exercise:", error);
        onError(error);
      } finally {
        setSubmitting(false);
      }
    },
    [
      validate,
      selectedExercise,
      makingCustomExercise,
      handleSaveNewExercise,
      name,
      muscleGroupID,
      isBodyweight,
      isTimeBased,
      sets,
      exercises,
      onError,
    ]
  );

  return (
    <Modal onRequestClose={onClose}>
      {loading && !fetchedOnce && (
        <div className="absolute inset-0 bg-white/75 flex flex-col items-center justify-center z-10 rounded-xl">
          <span className="inline-flex items-center justify-center bg-blue-50 rounded-full p-4">
            <SpinnerIcon />
          </span>
        </div>
      )}

      <h1 className="text-body font-semibold mb-4">
        {replaceExerciseID ? (
          t("menus.replace_exercise")
        ) : (
          <>
            {t("general.add")} {t("add_workout_exercise_modal.exercise_title")}{" "}
            {t("general.to")} {workoutName}
          </>
        )}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <MuscleGroupSelect
          t={t}
          muscleGroups={muscleGroupsL10n}
          value={muscleGroupID}
          onChange={setMuscleGroupID}
          required={makingCustomExercise}
          openWhich={openWhich}
          setOpenWhich={setOpenWhich}
        />
        {formErrors.muscleGroupID && (
          <p className="text-caption-red mt-1">{formErrors.muscleGroupID}</p>
        )}

        {!makingCustomExercise ? (
          <ExerciseSelect
            t={t}
            exercises={exercisesL10n}
            muscleGroupID={muscleGroupID}
            value={selectedExercise}
            onChange={setSelectedExercise}
            error={formErrors.exerciseID}
            openWhich={openWhich}
            setOpenWhich={setOpenWhich}
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
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t("general.cancel")}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submittingNow || loading}
          >
            {submittingNow || loading
              ? t("general.loading")
              : replaceExerciseID
              ? t("general.replace")
              : t("general.add")}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddWorkoutExerciseModal;

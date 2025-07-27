import { useState, useEffect, useRef } from "react";
import api from "../api";
import { cloneElement } from "react";
import SpinnerIcon from "../icons/SpinnerIcon";
import { useTranslation } from "react-i18next";
import CheckBox from "../components/CheckBox";

const AddWorkoutExerciseModal = ({
  open: openProp,
  onOpenChange,
  trigger,
  workoutID,
  workoutName,
  planID,
  cycleID,
  exercise,
  onUpdateExercises,
  onError,
  buttonText,
  dummyMode = false,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { t } = useTranslation();

  const isControlled = openProp !== undefined && onOpenChange;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const close = () => setOpen(false);

  const modalRef = useRef(null);
  const [exercisesArray, setExercisesArray] = useState([]);
  const [muscleGroupsArray, setMuscleGroupsArray] = useState([]);
  const [exercisesFetched, setExercisesFetched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [makingCustomExercise, setMakingCustomExercise] = useState(false);

  const [exerciseID, setExerciseID] = useState("");
  const [name, setName] = useState("");
  const [muscleGroupID, setMuscleGroupID] = useState("");
  const [sets, setSets] = useState("");
  const [isBodyweight, setIsBodyweight] = useState(false);
  const [isTimeBased, setIsTimeBased] = useState(false);

  // Fetch exercises when the modal opens
  useEffect(() => {
    if (!open || exercisesFetched) return;

    setLoading(true);
    const ac = new AbortController();

    Promise.all([
      api.get("exercises/", { signal: ac.signal }),
      api.get("individual-exercises", { signal: ac.signal }),
      api.get("muscle-groups/", { signal: ac.signal }),
    ])
      .then(([res1, res2, res3]) => {
        const merged = [
          ...res1.data.map((ex) => ({ ...ex, source: "pool" })),
          ...res2.data
            .filter((ex) => !ex.exercise_id)
            .map((ex) => ({ ...ex, source: "custom" })),
        ];
        setMuscleGroupsArray(res3.data);
        setExercisesArray(merged);
        setExercisesFetched(true);
      })
      .catch((err) => {
        if (!ac.signal.aborted) onError(err);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [open]);

  useEffect(() => {
    function handleClick(e) {
      if (open && modalRef.current && !modalRef.current.contains(e.target)) {
        close();
      }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
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

  useEffect(() => {
    if (!open) setMakingCustomExercise(false);
  }, [open]);

  const validate = () => {
    const newErrors = {};
    if (makingCustomExercise) {
      if (!name) newErrors.name = t("add_workout_exercise_modal.name_required");
      if (!muscleGroupID)
        newErrors.muscleGroupID = t(
          "add_workout_exercise_modal.muscle_group_required"
        );
      if (!sets || isNaN(sets) || sets < 1)
        newErrors.sets = t("add_workout_exercise_modal.sets_required");
      if (
        exercisesArray.find(
          (ex) => ex.name.toLowerCase() === name.toLowerCase()
        )
      )
        newErrors.name = t(
          "add_workout_exercise_modal.exercise_already_exists"
        );
    } else {
      if (!exerciseID)
        newErrors.exerciseID = t(
          "add_workout_exercise_modal.exercise_required"
        );
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setFormErrors(formErrors);
      return;
    }

    setLoading(true);

    let source, id;
    if (exerciseID) [source, id] = String(exerciseID).split("-");

    if (makingCustomExercise) {
      handleSaveNewExercise(
        {
          name,
          muscle_group_id: muscleGroupID,
          is_bodyweight: isBodyweight,
          is_time_based: isTimeBased,
        },
        sets
      );
      setExercisesFetched(false); // Reset exercises to refetch on next open
      return;
    }

    const exObj = exercisesArray.find(
      (ex) => `${ex.source}-${ex.id}` === exerciseID
    );

    if (!exObj) {
      console.error("Selected exercise not found in the list: ", exerciseID);
      onError(new Error("Selected exercise not found in the list."));
      setLoading(false);
      return;
    }

    if (source === "pool") {
      handleSaveNewExercise(
        {
          id: exObj.id,
          is_bodyweight: exObj.is_bodyweight,
          is_time_based: exObj.is_time_based,
        },
        sets
      );
    }
    // If picked from custom, send name and muscle group only
    else {
      handleSaveNewExercise(
        {
          name: exObj.name,
          muscle_group_id: exObj.muscle_group_id,
          is_bodyweight: exObj.is_bodyweight,
          is_time_based: exObj.is_time_based,
        },
        sets
      );
    }
  };

  const handleSaveNewExercise = async (newExercise, sets) => {
    try {
      sets = Number(sets);
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

      const { data: workoutExercise } = !dummyMode
        ? exercise
          ? await api.post(
              `workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exercise.id}/replace`,
              {
                individual_exercise_id: individualExercise.id,
                sets_qt: sets,
              }
            )
          : await api.post(
              `workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises`,
              {
                individual_exercise_id: individualExercise.id,
                sets_qt: sets,
              }
            )
        : {
            data: {
              individual_exercise_id: individualExercise.id,
              sets_qt: sets,
              workoutID: workoutID,
            },
          };

      individualExercise.muscle_group = muscleGroupsArray.find(
        (group) => group.id === individualExercise.muscle_group_id
      );

      onUpdateExercises((prev) =>
        exercise
          ? prev.map((ex) =>
              ex.id === exercise.id
                ? {
                    ...workoutExercise,
                    individual_exercise: individualExercise,
                  }
                : ex
            )
          : [
              ...prev,
              { ...workoutExercise, individual_exercise: individualExercise },
            ]
      );

      close();
    } catch (error) {
      console.error("Error saving new exercise:", error);
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {trigger ? cloneElement(trigger, { onClick: () => setOpen(true) }) : null}
      {open && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex justify-center items-center z-50">
          <div
            ref={modalRef}
            className="relative bg-white rounded-2xl shadow-lg p-8 min-w-sm sm:min-w-lg"
          >
            {loading && (
              <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center z-10 rounded-2xl">
                <span className="inline-flex items-center justify-center bg-blue-50 rounded-full p-4">
                  <SpinnerIcon />
                </span>
              </div>
            )}

            <h1 className="text-body font-semibold mb-4">
              {!!buttonText ? buttonText : t("general.add")}{" "}
              {t("add_workout_exercise_modal.exercise_title")}{" "}
              {!exercise && `${t("general.to")} ${workoutName}`}
            </h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <select
                className="input-style"
                value={muscleGroupID}
                onChange={(e) => setMuscleGroupID(Number(e.target.value))}
                required={makingCustomExercise}
              >
                <option value="">
                  {makingCustomExercise
                    ? t("add_workout_exercise_modal.select_muscle_group")
                    : t("add_workout_exercise_modal.all_muscle_groups")}
                </option>
                {muscleGroupsArray.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {formErrors.muscleGroupID && (
                <p className="text-caption-red mt-1">
                  {formErrors.muscleGroupID}
                </p>
              )}
              {!makingCustomExercise ? (
                <>
                  <select
                    className="input-style"
                    value={exerciseID}
                    onChange={(e) => setExerciseID(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      {t("add_workout_exercise_modal.select_exercise")}
                    </option>
                    {exercisesArray
                      .filter((ex) =>
                        muscleGroupID
                          ? ex.muscle_group_id === muscleGroupID
                          : ex
                      )
                      .map((ex) => (
                        <option
                          key={`${ex.source}-${ex.id}`}
                          value={`${ex.source}-${ex.id}`}
                        >
                          {ex.name}
                          {ex.source === "custom"
                            ? ` ${t(
                                "add_workout_exercise_modal.custom_suffix"
                              )}`
                            : ""}
                        </option>
                      ))}
                  </select>
                  {formErrors.exerciseID && (
                    <p className="text-caption-red mt-1">
                      {formErrors.exerciseID}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <input
                    className="input-style"
                    type="text"
                    placeholder={t(
                      "add_workout_exercise_modal.exercise_name_placeholder"
                    )}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  {formErrors.name && (
                    <p className="text-caption-red mt-1">{formErrors.name}</p>
                  )}

                  <div className="flex justify-between align-center gap-6">
                    <span className="flex items-center text-caption gap-2">
                      <span>
                        {t("add_workout_exercise_modal.is_bodyweight")}
                      </span>
                      <CheckBox
                        title={t("workout_plan_single.is_bodyweight")}
                        checked={isBodyweight}
                        onChange={(e) => {
                          setIsBodyweight(e.target.checked);
                        }}
                      />
                    </span>
                    <span className="flex items-center text-caption gap-2">
                      <span>
                        {t("add_workout_exercise_modal.is_time_based")}
                      </span>
                      <CheckBox
                        title={t("workout_plan_single.set_completed")}
                        checked={isTimeBased}
                        onChange={(e) => {
                          setIsTimeBased(e.target.checked);
                        }}
                      />
                    </span>
                  </div>
                </>
              )}
              <input
                className="input-style"
                type="number"
                placeholder={
                  t("measurements.sets")[0].toUpperCase() +
                  t("measurements.sets").slice(1)
                }
                inputMode="numeric"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                min={1}
                required
              />
              {formErrors.sets && (
                <p className="text-caption-red mt-1">{formErrors.sets}</p>
              )}
              <button
                type="button"
                className="text-caption-blue hover:underline mb-2"
                onClick={() => setMakingCustomExercise(!makingCustomExercise)}
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
                    : !!buttonText
                    ? buttonText
                    : t("general.add")}
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

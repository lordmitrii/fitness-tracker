// AddExerciseOrMuscleModal.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import MuscleGroupSelect from "../../components/workout/MuscleGroupSelect";
import SpinnerIcon from "../../icons/SpinnerIcon";
import CheckBox from "../../components/CheckBox";

const AddExerciseOrMuscleModal = ({
  exercisesL10n = [],
  muscleGroupsL10n = [],
  loading = false,
  onCreateExercise,
  onCreateMuscleGroup,
  onClose,
  onError,
}) => {
  const { t } = useTranslation();

  const [mode, setMode] = useState("exercise");
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [isBodyweight, setIsBodyweight] = useState(false);
  const [isTimeBased, setIsTimeBased] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [muscleGroupID, setMuscleGroupID] = useState(null);
  const [openWhich, setOpenWhich] = useState("none");

  const resetForm = () => {
    setName("");
    setIsBodyweight(false);
    setIsTimeBased(false);
    setAutoTranslate(true);
    setMuscleGroupID(null);
    setFormErrors({});
  };

  const validate = () => {
    const errors = {};
    const trimmed = name.trim();

    if (!trimmed) {
      errors.name = t("admin.exercises.name_required");
    } else if (trimmed.length > 50) {
      errors.name = t("general.name_too_long", { limit: 50 });
    }

    if (mode === "exercise") {
      if (!muscleGroupID) {
        errors.muscleGroupID = t("admin.exercises.muscle_group_required");
      }
      const dup = exercisesL10n.find(
        (ex) =>
          (ex._label || ex.name || "").trim().toLowerCase() ===
          trimmed.toLowerCase()
      );
      if (!errors.name && dup) {
        errors.name = t("admin.exercises.exercise_already_exists");
      }
    } else {
      const dupG = muscleGroupsL10n.find(
        (g) =>
          (g._label || g.name || "").trim().toLowerCase() ===
          trimmed.toLowerCase()
      );
      if (!errors.name && dupG) {
        errors.name = t("admin.exercises.muscle_group_already_exists");
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "exercise") {
        await (typeof onCreateExercise === "function"
          ? onCreateExercise({
              name: name.trim(),
              muscle_group_id: muscleGroupID,
              auto_translate: autoTranslate,
              is_time_based: isTimeBased,
              is_bodyweight: isBodyweight,
            })
          : onCreateExercise?.mutateAsync?.({
              name: name.trim(),
              muscle_group_id: muscleGroupID,
              auto_translate: autoTranslate,
              is_time_based: isTimeBased,
              is_bodyweight: isBodyweight,
            }));
      } else {
        await (typeof onCreateMuscleGroup === "function"
          ? onCreateMuscleGroup({
              name: name.trim(),
              auto_translate: autoTranslate,
            })
          : onCreateMuscleGroup?.mutateAsync?.({
              name: name.trim(),
              auto_translate: autoTranslate,
            }));
      }
      resetForm();
      onClose?.();
    } catch (err) {
      console.error("Error creating exercise or muscle group:", err);
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  };

  const submittingNow = submitting || loading;

  return (
    <Modal onRequestClose={onClose}>
      {loading && (
        <div className="absolute inset-0 bg-white/75 flex flex-col items-center justify-center z-10 rounded-xl">
          <span className="inline-flex items-center justify-center bg-blue-50 rounded-full p-4">
            <SpinnerIcon />
          </span>
        </div>
      )}

      <h1 className="text-body font-semibold mb-4">
        {mode === "exercise"
          ? `${t("general.add")} ${t("admin.exercises.exercise")}`
          : `${t("general.add")} ${t("admin.exercises.muscle_group")}`}
      </h1>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => {
            setMode("exercise");
            setFormErrors({});
          }}
          className={`btn ${
            mode === "exercise" ? "btn-primary" : "btn-secondary"
          }`}
        >
          {t("admin.exercises.exercise")}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("muscle");
            setFormErrors({});
          }}
          className={`btn ${
            mode === "muscle" ? "btn-primary" : "btn-secondary"
          }`}
        >
          {t("admin.exercises.muscle_group")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <input
            className="input-style"
            type="text"
            autoComplete="off"
            maxLength={50}
            placeholder={
              mode === "exercise"
                ? t("admin.exercises.exercise_name_placeholder")
                : t("admin.exercises.muscle_group_name_placeholder")
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {formErrors.name && (
            <p className="text-caption-red mt-1">{formErrors.name}</p>
          )}
        </div>

        {mode === "exercise" && (
          <>
            <div>
              <MuscleGroupSelect
                t={t}
                muscleGroups={muscleGroupsL10n} // <- use pre-localized list
                value={muscleGroupID}
                onChange={setMuscleGroupID}
                required
                openWhich={openWhich}
                setOpenWhich={setOpenWhich}
              />
              {formErrors.muscleGroupID && (
                <p className="text-caption-red mt-1">
                  {formErrors.muscleGroupID}
                </p>
              )}
            </div>
            <div className="flex justify-between align-center text-caption gap-6">
              <div className="flex items-center gap-2">
                <CheckBox
                  id="is-bodyweight"
                  title={t("workout_plan_single.is_bodyweight")}
                  checked={isBodyweight}
                  onChange={(e) => setIsBodyweight(e.target.checked)}
                />
                <label htmlFor="is-bodyweight">
                  {t("admin.exercises.is_bodyweight")}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <CheckBox
                  id="is-time-based"
                  title={t("workout_plan_single.set_completed")}
                  checked={isTimeBased}
                  onChange={(e) => setIsTimeBased(e.target.checked)}
                />
                <label htmlFor="is-time-based">
                  {t("admin.exercises.is_time_based")}
                </label>
              </div>
            </div>
          </>
        )}

        <div className="flex items-center text-caption gap-2">
          <CheckBox
            id="auto-translate"
            title={t("admin.exercises.auto_translate")}
            checked={autoTranslate}
            onChange={(e) => setAutoTranslate(e.target.checked)}
            disabled={submittingNow}
          />
          <label htmlFor="auto-translate">
            {t("admin.exercises.auto_translate")}
          </label>
        </div>

        <div className="flex gap-2 justify-between mt-3">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t("general.cancel")}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submittingNow}
          >
            {submittingNow ? t("general.loading") : t("general.add")}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddExerciseOrMuscleModal;

import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import DaysPerCycleSelector from "../components/DaysPerCycleSelector";
import QuestionMarkTooltip from "../components/QuestionMarkTooltip";
import AddWorkoutExerciseModal from "../forms/AddWorkoutExerciseModal";
import Stepper from "../components/Stepper";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import EditIcon from "../icons/EditIcon";
import ListIcon from "../icons/ListIcon";
import { useTranslation } from "react-i18next";
import CloseIcon from "../icons/CloseIcon";

const ExerciseChip = ({ ex, onDelete }) => {
  const { t } = useTranslation();
  return (
    <div className="w-35 h-10 inline-flex items-center justify-center px-2 rounded-lg bg-blue-50 text-caption-blue font-medium border border-blue-200 mr-2 mb-2">
      <span className="flex items-center justify-between gap-2">
        {ex.individual_exercise?.name || ex}
        {ex.sets_qt
          ? ` x ${ex.sets_qt} ${
              ex.sets_qt > 1 ? t("measurements.sets") : t("measurements.set")
            }`
          : ""}
        {onDelete && (
          <button className="size-6" onClick={onDelete}>
            <CloseIcon />
          </button>
        )}
      </span>
    </div>
  );
};

const AddWorkoutPlanForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [planName, setPlanName] = useState("");
  const [daysPerCycle, setDaysPerCycle] = useState(1);
  const [workouts, setWorkouts] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [step, setStep] = useState(1);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedData = sessionStorage.getItem("workoutPlanDraft");
    if (savedData) {
      const { planName, daysPerCycle, workouts, step } = JSON.parse(savedData);
      setPlanName(planName);
      setDaysPerCycle(daysPerCycle);
      setWorkouts(workouts);
      setStep(step || 1);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;

    setWorkouts((prev) => {
      if (daysPerCycle > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: daysPerCycle - prev.length }, (_, i) => ({
            id: prev.length + i + 1,
            name: `Workout ${prev.length + i + 1}`,
            workout_exercises: [],
            index: prev.length + i + 1,
          })),
        ];
      } else if (daysPerCycle < prev.length) {
        return prev.slice(0, daysPerCycle);
      }
      return prev;
    });
  }, [daysPerCycle, loading]);

  useEffect(() => {
    if (loading) return;
    sessionStorage.setItem(
      "workoutPlanDraft",
      JSON.stringify({
        planName,
        daysPerCycle,
        workouts,
        step,
      })
    );
  }, [planName, daysPerCycle, workouts, step]);

  const handleClearDraft = () => {
    sessionStorage.removeItem("workoutPlanDraft");
    setPlanName("");
    setDaysPerCycle(1);
    setWorkouts([]);
    setStep(1);
  };

  const handleUpdateExercises = (dayIdx) => (update) => {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === dayIdx
          ? {
              ...w,
              workout_exercises:
                typeof update === "function"
                  ? update(w.workout_exercises)
                  : update,
            }
          : w
      )
    );
  };

  const validateStep1 = () => {
    const errors = {};
    if (!planName.trim()) {
      errors.name = t("add_workout_plan_form.plan_name_required");
    }
    if (daysPerCycle < 1) {
      errors.daysPerCycle = t("add_workout_plan_form.plan_days_more_than_one");
    }
    return errors;
  };

  const handleStepperClick = (nextStep) => {
    const errors = validateStep1();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setStep(nextStep);
  };

  if (loading) return <LoadingState />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  if (step === 1) {
    return (
      <div className="card flex flex-col">
        <Stepper
          step={step}
          total={daysPerCycle + 2}
          onStepClick={handleStepperClick}
        />
        <div className="text-center mb-6 text-caption font-medium">
          {t("add_workout_plan_form.step_of", {
            step,
            total: daysPerCycle + 2,
          })}
        </div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-title font-semibold">
            {t("add_workout_plan_form.create_workout_plan")}
          </h1>
          {(workouts.length > 1 || planName) && (
            <button
              type="button"
              onClick={handleClearDraft}
              className="self-end btn btn-secondary"
            >
              {t("add_workout_plan_form.clear_draft")}
            </button>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const errors = validateStep1();
            if (Object.keys(errors).length > 0) {
              setFormErrors(errors);
              return;
            }
            setFormErrors({});
            setStep(2);
          }}
          className="space-y-5"
        >
          <div>
            <label className="block text-body font-medium mb-1">
              {t("add_workout_plan_form.plan_name_label")}
            </label>
            <input
              type="text"
              value={planName}
              maxLength={50}
              placeholder={t("add_workout_plan_form.plan_name_placeholder")}
              onChange={(e) => setPlanName(e.target.value)}
              className="input-style"
            />
            <div className="text-right text-caption mt-1">
              {planName.length}/50
            </div>
            {formErrors.name && (
              <p className="text-caption-red mt-1">{formErrors.name}</p>
            )}
          </div>
          <div>
            <div className="block text-body font-medium mb-1">
              <span className="flex items-center gap-2">
                {t("add_workout_plan_form.days_per_cycle_label")}
                <QuestionMarkTooltip
                  text={t("add_workout_plan_form.days_per_cycle_tooltip")}
                />
              </span>
            </div>
            <DaysPerCycleSelector
              value={daysPerCycle}
              onChange={setDaysPerCycle}
            />
            {formErrors.daysPerCycle && (
              <p className="text-caption-red mt-1">{formErrors.daysPerCycle}</p>
            )}
          </div>
          <button className="btn btn-primary w-full">
            {t("general.continue")}
          </button>
        </form>
      </div>
    );
  }

  if (step > 1 && step <= daysPerCycle + 1) {
    const workoutIdx = step - 2;
    return (
      <div className="card flex flex-col">
        <Stepper
          step={step}
          total={daysPerCycle + 2}
          onStepClick={handleStepperClick}
        />
        <div className="text-center mb-6 text-caption font-medium">
          {t("add_workout_plan_form.step_of", {
            step,
            total: daysPerCycle + 2,
          })}
        </div>
        <WorkoutDayExercises
          workout={workouts[workoutIdx]}
          onUpdate={handleUpdateExercises(workoutIdx)}
          onNext={() => setStep(step + 1)}
          onBack={() => setStep(step - 1)}
          onSkipToPreview={() => {
            if (
              !window.confirm(
                t("add_workout_plan_form.skip_to_preview_confirm")
              )
            )
              return;
            setStep(daysPerCycle + 2);
          }}
          onError={setError}
        />
      </div>
    );
  }

  if (step === daysPerCycle + 2) {
    const handleCreate = async () => {
      try {
        const {
          data: { id: planID, current_cycle_id: currentCycleID },
        } = await api.post("/workout-plans", {
          name: planName.trim(),
          active: true,
        });

        await api.post(
          `/workout-plans/${planID}/workout-cycles/${currentCycleID}/workouts/create-multiple`,
          workouts
        );

        sessionStorage.removeItem("workoutPlanDraft");
        navigate("/workout-plans");
      } catch (error) {
        console.error("Error creating workout plan:", error);
        setError(error);
      }
    };

    return (
      <div className="card flex flex-col">
        <Stepper
          step={step}
          total={daysPerCycle + 2}
          onStepClick={handleStepperClick}
        />
        <div className="text-center mb-6 text-caption font-medium">
          {t("add_workout_plan_form.step_of", {
            step,
            total: daysPerCycle + 2,
          })}
        </div>
        <h2 className="text-title font-semibold mb-4">
          {t("add_workout_plan_form.preview_title")}
        </h2>
        <div className="mb-4">
          <div className="text-body font-semibold mb-2">
            {t("general.name")}: {planName}
          </div>
          <div className="text-body font-semibold mb-2">
            {t("add_workout_plan_form.days_per_cycle_value")}: {daysPerCycle}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {workouts.map((wk, idx) => (
            <div
              key={wk.index}
              className="bg-blue-50 border-l-4 border-blue-400 rounded-xl p-4 shadow flex flex-col relative"
            >
              <h3 className="font-bold text-body-blue mb-2 flex items-center">
                <span className="inline-block mr-2">
                  {t("general.workout")} {wk.index}
                </span>
                <button
                  className="ml-auto text-blue-500 hover:text-gray-500"
                  onClick={() => setStep(idx + 2)}
                >
                  <EditIcon />
                </button>
              </h3>
              {wk.workout_exercises.length > 0 ? (
                <div className="flex flex-wrap">
                  {wk.workout_exercises.map((ex, i) => (
                    <ExerciseChip ex={ex} key={i} />
                  ))}
                </div>
              ) : (
                <span className="text-caption">
                  {t("add_workout_plan_form.no_exercises")}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button
            className="btn btn-secondary"
            onClick={() => setStep(step - 1)}
          >
            {t("general.back")}
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            {t("general.create")}
          </button>
        </div>
      </div>
    );
  }
  return null; // Should never reach here
};

const WorkoutDayExercises = ({
  workout,
  onUpdate,
  onNext,
  onBack,
  onSkipToPreview,
  onError,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-title font-semibold">
          {workout.name}: {t("add_workout_plan_form.add_exercises")}
        </h1>
        <button
          className="btn btn-secondary"
          onClick={onSkipToPreview}
          type="button"
        >
          {t("add_workout_plan_form.skip_to_preview")}
        </button>
      </div>
      <div className="rounded-2xl shadow-lg bg-white border border-gray-200 p-6 hover:shadow-lg transition flex flex-col gap-3 mb-6">
        <h3 className="text-body-blue font-semibold">
          {t("add_workout_plan_form.exercise_list_title")}
        </h3>
        {workout.workout_exercises.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            {workout.workout_exercises.map((ex, idx) => (
              <ExerciseChip
                key={idx}
                ex={ex}
                onDelete={() =>
                  onUpdate((prev) => prev.filter((_, i) => i !== idx))
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-caption flex flex-col items-center py-6">
            <ListIcon />
            <span>{t("add_workout_plan_form.no_exercises_yet")}</span>
          </div>
        )}
        <AddWorkoutExerciseModal
          trigger={
            <button className="btn btn-primary flex items-center mx-auto">
              <span>+ {t("add_workout_plan_form.add_exercise_button")}</span>
            </button>
          }
          workoutID={workout.id}
          workoutName={workout.name}
          onUpdateExercises={onUpdate}
          dummyMode={true}
          onError={onError}
        />
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="btn btn-secondary">
          {t("general.back")}
        </button>
        <button
          className={`btn ${
            workout.workout_exercises.length === 0
              ? "btn-secondary"
              : "btn-success"
          }`}
          onClick={onNext}
        >
          {t("add_workout_plan_form.go_to_next_day")}
        </button>
      </div>
    </>
  );
};

export default AddWorkoutPlanForm;

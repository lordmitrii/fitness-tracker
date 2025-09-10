import { useState, useMemo, useCallback, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import DaysPerCycleSelector from "../../components/DaysPerCycleSelector";
import QuestionMarkTooltipModal from "../../modals/workout/QuestionMarkTooltipModal";
import AddWorkoutExerciseModal from "../../modals/workout/AddWorkoutExerciseModal";
import Stepper from "../../components/Stepper";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import EditIcon from "../../icons/EditIcon";
import ListIcon from "../../icons/ListIcon";
import { useTranslation } from "react-i18next";
import CloseIcon from "../../icons/CloseIcon";
import useStorageObject from "../../hooks/useStorageObject";
import usePlansData from "../../hooks/data/usePlansData";
import { usePullToRefreshOverride } from "../../context/PullToRefreshContext";

const makeWorkout = (id) => ({
  id,
  name: `Workout ${id}`,
  workout_exercises: [],
  index: id,
});

const normalizeWorkouts = (daysPerCycle, prevWorkouts = []) => {
  if (daysPerCycle === prevWorkouts.length) return prevWorkouts;
  if (daysPerCycle > prevWorkouts.length) {
    const startId = prevWorkouts.length + 1;
    const extras = Array.from(
      { length: daysPerCycle - prevWorkouts.length },
      (_, i) => makeWorkout(startId + i)
    );
    return [...prevWorkouts, ...extras];
  }
  return prevWorkouts.slice(0, daysPerCycle);
};

const ExerciseChip = memo(({ t, ex, onDelete }) => {
  return (
    <div className="w-35 min-h-10 inline-flex items-center justify-center py-1 px-2 rounded-lg bg-gradient-to-r from-blue-200/80 to-blue-300/30 text-caption-blue font-medium border border-blue-200 mr-2 mb-2">
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
});

const WorkoutDayExercises = memo(
  ({
    t,
    workout,
    onUpdate,
    onNext,
    onBack,
    onSkipToPreview,
    onError,
    isModalOpen,
    setIsModalOpen,
  }) => {
    const removeAt = useCallback(
      (idx) => onUpdate((prev) => prev.filter((_, i) => i !== idx)),
      [onUpdate]
    );

    const openModal = useCallback(() => setIsModalOpen(true), [setIsModalOpen]);

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
                  t={t}
                  key={ex.id || `${workout.id}-${idx}`}
                  ex={ex}
                  onDelete={() => removeAt(idx)}
                />
              ))}
            </div>
          ) : (
            <div className="text-caption flex flex-col items-center py-6">
              <ListIcon />
              <span>{t("add_workout_plan_form.no_exercises_yet")}</span>
            </div>
          )}
          <button
            className="btn btn-primary flex items-center mx-auto"
            onClick={openModal}
          >
            <span>+ {t("add_workout_plan_form.add_exercise_button")}</span>
          </button>
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
        {isModalOpen && (
          <AddWorkoutExerciseModal
            workoutID={workout.id}
            workoutName={workout.name}
            onUpdateExercises={onUpdate}
            dummyMode={true}
            onError={onError}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </>
    );
  }
);

const AddWorkoutPlanForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutations, refetch } = usePlansData({ skipQuery: true });

  usePullToRefreshOverride(
    useCallback(async () => {
      await refetch();
    }, [refetch])
  );

  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState(null);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [draft, setDraft, { restoring, clear }] = useStorageObject(
    "workoutPlanDraft",
    { planName: "", daysPerCycle: 1, workouts: [], step: 1 }
  );

  const { planName, daysPerCycle, workouts, step } = draft;
  const totalSteps = useMemo(() => daysPerCycle + 2, [daysPerCycle]);

  useEffect(() => {
    if (restoring) return;

    setDraft((prev) => {
      const normalized = normalizeWorkouts(
        prev.daysPerCycle,
        prev.workouts || []
      );
      if (normalized === prev.workouts) return prev;
      const maxStep = (prev.daysPerCycle ?? 1) + 2;
      return {
        ...prev,
        workouts: normalized,
        step: Math.min(prev.step ?? 1, maxStep),
      };
    });
  }, [restoring]);

  const setStep = useCallback(
    (next) =>
      setDraft((d) => {
        const max = (d.daysPerCycle ?? 1) + 2;
        const value = typeof next === "function" ? next(d.step) : next;
        return { ...d, step: Math.max(1, Math.min(value, max)) };
      }),
    [setDraft]
  );

  const setPlanName = useCallback(
    (value) => setDraft((d) => ({ ...d, planName: value })),
    [setDraft]
  );

  const setDays = useCallback(
    (value) =>
      setDraft((d) => {
        const workouts = normalizeWorkouts(value, d.workouts || []);
        const maxStep = value + 2;
        return {
          ...d,
          daysPerCycle: value,
          workouts,
          step: Math.min(d.step, maxStep),
        };
      }),
    [setDraft]
  );

  const handleUpdateExercises = useCallback(
    (dayIdx) => (update) =>
      setDraft((prev) => ({
        ...prev,
        workouts: prev.workouts.map((w, i) =>
          i === dayIdx
            ? {
                ...w,
                workout_exercises:
                  typeof update === "function"
                    ? update(w.workout_exercises)
                    : update,
              }
            : w
        ),
      })),
    [setDraft]
  );

  const goNext = useCallback(() => setStep((s) => s + 1), [setStep]);
  const goBack = useCallback(() => setStep((s) => s - 1), [setStep]);
  const skipToPreview = useCallback(() => {
    if (!window.confirm(t("add_workout_plan_form.skip_to_preview_confirm")))
      return;
    setStep(daysPerCycle + 2);
  }, [setStep, daysPerCycle, t]);

  const handleClearDraft = useCallback(() => clear(), [clear]);

  const validateStep1 = useCallback(() => {
    const errors = {};
    if (!planName.trim())
      errors.name = t("add_workout_plan_form.plan_name_required");
    else if (planName.length > 50)
      errors.name = t("general.name_too_long", { limit: 50 });
    if (daysPerCycle < 1)
      errors.daysPerCycle = t("add_workout_plan_form.plan_days_more_than_one");
    else if (daysPerCycle > 14)
      errors.daysPerCycle = t(
        "add_workout_plan_form.plan_days_less_than_fifteen"
      );
    return errors;
  }, [planName, daysPerCycle, t]);

  const handleStepperClick = useCallback(
    (nextStep) => {
      const errors = validateStep1();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      setStep(nextStep);
    },
    [validateStep1, setStep]
  );

  if (restoring) return <LoadingState />;
  if (error)
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );

  if (step === 1) {
    const onSubmit = (e) => {
      e.preventDefault();
      const errors = validateStep1();
      if (Object.keys(errors).length) {
        setFormErrors(errors);
        return;
      }
      setFormErrors({});
      setStep(2);
    };

    return (
      <>
        <div className="card flex flex-col">
          <Stepper
            step={step}
            total={totalSteps}
            onStepClick={handleStepperClick}
          />
          <div className="text-center mb-6 text-caption font-medium">
            {t("add_workout_plan_form.step_of", {
              step,
              total: totalSteps,
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
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-body font-medium">
                  {t("add_workout_plan_form.plan_name_label")}
                </label>
                <div className="text-caption">{planName.length}/50</div>
              </div>
              <input
                id="name"
                name="name"
                type="text"
                value={planName}
                maxLength={50}
                inputMode="text"
                autoComplete="off"
                placeholder={t("add_workout_plan_form.plan_name_placeholder")}
                onChange={(e) => setPlanName(e.target.value)}
                className="input-style"
              />
              {formErrors.name && (
                <p className="text-caption-red mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <div className="block text-body font-medium mb-1">
                <span className="flex items-center gap-2">
                  {t("add_workout_plan_form.days_per_cycle_label")}
                  <button
                    type="button"
                    className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-r from-blue-400/60 to-blue-300/70 text-blue-700 font-bold shadow-sm hover:bg-blue-200 transition outline-none"
                    onClick={() => setIsTooltipOpen(true)}
                  >
                    ?
                  </button>
                </span>
              </div>
              <DaysPerCycleSelector value={daysPerCycle} onChange={setDays} />
              {formErrors.daysPerCycle && (
                <p className="text-caption-red mt-1">
                  {formErrors.daysPerCycle}
                </p>
              )}
            </div>
            <button className="btn btn-primary w-full" type="submit">
              {t("general.continue")}
            </button>
          </form>
        </div>
        {isTooltipOpen && (
          <QuestionMarkTooltipModal
            text={t("add_workout_plan_form.days_per_cycle_tooltip")}
            onClose={() => setIsTooltipOpen(false)}
          />
        )}
      </>
    );
  }

  if (step > 1 && step <= daysPerCycle + 1) {
    const workoutIdx = step - 2;

    return (
      <div className="card flex flex-col">
        <Stepper
          step={step}
          total={totalSteps}
          onStepClick={handleStepperClick}
        />
        <div className="text-center mb-6 text-caption font-medium">
          {t("add_workout_plan_form.step_of", {
            step,
            total: totalSteps,
          })}
        </div>
        <WorkoutDayExercises
          t={t}
          workout={workouts[workoutIdx]}
          onUpdate={handleUpdateExercises(workoutIdx)}
          onNext={goNext}
          onBack={goBack}
          onSkipToPreview={skipToPreview}
          onError={setError}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        />
      </div>
    );
  }

  if (step === daysPerCycle + 2) {
    const handleCreate = async () => {
      if (isCreating) return;
      setIsCreating(true);
      try {
        await mutations.createPlanWithWorkouts.mutateAsync({
          name: planName.trim(),
          active: true,
          workouts,
        });
        clear();
        navigate("/workout-plans", { replace: true });
      } catch (error) {
        console.error(error);
        setError(error);
      } finally {
        setIsCreating(false);
      }
    };

    return (
      <div className="card flex flex-col">
        <Stepper
          step={step}
          total={totalSteps}
          onStepClick={handleStepperClick}
        />
        <div className="text-center mb-6 text-caption font-medium">
          {t("add_workout_plan_form.step_of", {
            step,
            total: totalSteps,
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
          {workouts.map((wk) => (
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
                  onClick={() => setStep(wk.index + 1)}
                >
                  <EditIcon />
                </button>
              </h3>
              {wk.workout_exercises.length > 0 ? (
                <div className="flex flex-wrap">
                  {wk.workout_exercises.map((ex, i) => (
                    <ExerciseChip t={t} ex={ex} key={`${wk.id}-${i}`} />
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
          <button className="btn btn-secondary" onClick={goBack}>
            {t("general.back")}
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            {isCreating ? t("general.loading") : t("general.create")}
          </button>
        </div>
      </div>
    );
  }
  return null; // Should never reach here
};

export default AddWorkoutPlanForm;

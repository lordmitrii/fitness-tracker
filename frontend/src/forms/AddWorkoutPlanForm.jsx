import { useState, useEffect, use } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import DaysPerCycleSelector from "../components/DaysPerCycleSelector";
import QuestionMarkTooltip from "../components/QuestionMarkTooltip";
import AddWorkoutExerciseModal from "../components/AddWorkoutExerciseModal";
import Stepper from "../components/Stepper";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import EditIcon from "../icons/EditIcon";
import ListIcon from "../icons/ListIcon";

const ExerciseChip = ({ ex }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-sm font-medium border border-blue-200 mr-2 mb-2">
    {ex.individual_exercise?.name || ex}
    {ex.sets_qt ? ` x ${ex.sets_qt} set${ex.sets_qt > 1 ? "s" : ""}` : ""}
  </span>
);

const AddWorkoutPlanForm = () => {
  const navigate = useNavigate();
  const [planName, setPlanName] = useState("");
  const [daysPerCycle, setDaysPerCycle] = useState(1);
  const [workouts, setWorkouts] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [step, setStep] = useState(1);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedData = localStorage.getItem("workoutPlanDraft");
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
            name: `Day ${prev.length + i + 1}`,
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
    localStorage.setItem(
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
    localStorage.removeItem("workoutPlanDraft");
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
    if (!planName.trim()) errors.name = "Workout plan name is required.";
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
      <div className="min-h-screen items-center bg-gray-50 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 flex flex-col">
          <Stepper
            step={step}
            total={daysPerCycle + 2}
            onStepClick={handleStepperClick}
          />
          <div className="text-center mb-6 text-gray-600 font-medium">
            Step {step} of {daysPerCycle + 2}
          </div>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">
              Create Workout Plan
            </h1>
            {(workouts.length > 1 || planName) && (
              <button
                type="button"
                onClick={handleClearDraft}
                className="self-end btn btn-secondary"
              >
                Clear Draft
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
              <label className="block text-lg font-medium text-gray-700 mb-1">
                Plan Name
              </label>
              <input
                type="text"
                value={planName}
                maxLength={50}
                placeholder="e.g. Upper/Lower Split, Full Body, etc."
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {planName.length}/50
              </div>
              {formErrors.name && (
                <p className="text-red-500 text-sm">{formErrors.name}</p>
              )}
            </div>
            <div>
              <div className="block text-lg font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  Days Per Cycle
                  <QuestionMarkTooltip text="You can think of a cycle as a week." />
                </span>
              </div>
              <DaysPerCycleSelector
                value={daysPerCycle}
                onChange={setDaysPerCycle}
              />
            </div>
            <button className="btn btn-primary w-full">Continue</button>
          </form>
        </div>
      </div>
    );
  }

  if (step > 1 && step <= daysPerCycle + 1) {
    const workoutIdx = step - 2;
    return (
      <div className="min-h-screen items-center bg-gray-50 px-4 mt-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 flex flex-col">
          <Stepper
            step={step}
            total={daysPerCycle + 2}
            onStepClick={handleStepperClick}
          />
          <div className="text-center mb-6 text-gray-600 font-medium">
            Step {step} of {daysPerCycle + 2}
          </div>
          <WorkoutDayExercises
            workout={workouts[workoutIdx]}
            onUpdate={handleUpdateExercises(workoutIdx)}
            onNext={() => setStep(step + 1)}
            onBack={() => setStep(step - 1)}
            onSkipToPreview={() => {
              if (
                !window.confirm(
                  "Are you sure you want to skip to preview? Note that you can add exercises later."
                )
              )
                return;
              setStep(daysPerCycle + 2);
            }}
            onError={setError}
          />
        </div>
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

        localStorage.removeItem("workoutPlanDraft");
        navigate("/workout-plans");
      } catch (error) {
        console.error("Error creating workout plan:", error);
        setError(error);
      }
    };

    return (
      <div className="min-h-screen items-center bg-gray-50 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 flex flex-col">
          <Stepper
            step={step}
            total={daysPerCycle + 2}
            onStepClick={handleStepperClick}
          />
          <div className="text-center mb-6 text-gray-600 font-medium">
            Step {step} of {daysPerCycle + 2}
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Preview Your Plan
          </h2>
          <div className="mb-4">
            <div className="text-md font-semibold text-gray-800 mb-2">
              Name: {planName}
            </div>
            <div className="text-md font-semibold text-gray-800 mb-2">
              Days per cycle: {daysPerCycle}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {workouts.map((wk, idx) => (
              <div
                key={wk.index}
                className="bg-blue-50 border-l-4 border-blue-400 rounded-xl p-4 shadow flex flex-col relative"
              >
                <h3 className="font-bold text-lg text-blue-900 mb-2 flex items-center">
                  <span className="inline-block mr-2">Day {wk.index}</span>
                  <button
                    className="ml-auto text-blue-600 hover:text-blue-800"
                    onClick={() => setStep(idx + 2)}
                    aria-label={`Edit ${wk.name}`}
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
                  <span className="text-gray-400">No exercises</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <button
              className="btn btn-secondary"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
            <button className="btn btn-primary" onClick={handleCreate}>
              Create
            </button>
          </div>
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
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          {workout.name}: Add Exercises
        </h1>
        <button
          className="btn btn-secondary"
          onClick={onSkipToPreview}
          type="button"
        >
          Skip to Preview
        </button>
      </div>
      <div className="rounded-2xl shadow-lg bg-white border border-gray-200 p-6 hover:shadow-lg transition flex flex-col gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-blue-800">Exercise list</h1>
        {workout.workout_exercises.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            {workout.workout_exercises.map((ex, idx) => (
              <ExerciseChip ex={ex} key={idx} />
            ))}
          </div>
        ) : (
          <div className="text-gray-400 flex flex-col items-center py-6">
            <ListIcon />
            <span>No exercises added yet</span>
          </div>
        )}
        <AddWorkoutExerciseModal
          trigger={
            <button className="btn btn-primary flex items-center mx-auto">
              <span>+ Add Exercise</span>
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
          Back
        </button>
        <button
          className={`btn ${
            workout.workout_exercises.length === 0
              ? "btn-secondary"
              : "btn-success"
          }`}
          onClick={onNext}
        >
          Go to Next Day
        </button>
      </div>
    </>
  );
};

export default AddWorkoutPlanForm;

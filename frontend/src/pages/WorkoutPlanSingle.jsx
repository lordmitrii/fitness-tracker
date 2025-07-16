import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import api from "../api";
import WorkoutCard from "../components/WorkoutCard";
import DropdownMenu from "../components/DropdownMenu";
import WorkoutCycleDetailsMenu from "../components/WorkoutCycleDetailsMenu";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import ProgressBar from "../components/ProgressBar";
import { ArrowLeftIcon, ArrowRightIcon } from "../icons/ArrowIcon";
import { useTranslation } from "react-i18next";

const WorkoutPlanSingle = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { planID, cycleID } = useParams();
  const [workoutPlanName, setWorkoutPlanName] = useState("");
  const [workoutPlanActive, setWorkoutPlanActive] = useState(false);
  const [workoutCycle, setWorkoutCycle] = useState(null);
  const [workouts, setWorkouts] = useState([]);

  const [nextCycleID, setNextCycleID] = useState(null);

  const [allWorkoutsCompleted, setAllWorkoutsCompleted] = useState(false);
  const [cycleCompleted, setCycleCompleted] = useState(false);

  const workoutRefs = useRef([]);
  const hasScrolled = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`workout-plans/${planID}`),
      api.get(`/workout-plans/${planID}/workout-cycles/${cycleID}`),
    ])
      .then(([res1, res2]) => {
        setWorkoutPlanActive(res1.data.active);
        setWorkoutPlanName(res1.data.name);
        setWorkoutCycle(res2.data);
        setWorkouts(res2.data.workouts);
        setCycleCompleted(res2.data.completed);
        setNextCycleID(res2.data.next_cycle_id);
      })
      .catch((error) => {
        console.error("Error fetching workout cycle:", error);
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [planID, cycleID]);

  useEffect(() => {
    if (!hasScrolled.current && workouts.length > 0) {
      const firstIncompleteWorkout = workouts.find(
        (workout) => !workout.completed && workout.workout_exercises.length > 0
      );
      if (firstIncompleteWorkout) {
        const index = workouts.indexOf(firstIncompleteWorkout);
        const ref = workoutRefs.current[index];
        if (ref) {
          ref.scrollIntoView({ behavior: "smooth", block: "start" });
          hasScrolled.current = true;
        } else {
          hasScrolled.current = false;
        }
      }
    }
  }, [workouts]);

  useEffect(() => {
    const allCompleted =
      workouts.length > 0 && workouts.every((workout) => workout.completed);
    setAllWorkoutsCompleted(allCompleted);
  }, [workouts]);

  const allSets = workouts.flatMap((workout) =>
    (workout.workout_exercises || []).flatMap((ex) => ex.workout_sets || [])
  );
  const totalSets = allSets.length;
  const completedSets = allSets.filter((set) => set.completed).length;

  const handleCycleComplete = () => {
    if (
      !allWorkoutsCompleted &&
      !window.confirm(t("workout_plan_single.confirm_complete"))
    ) {
      return;
    }

    api
      .patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/update-complete`,
        { completed: true }
      )
      .then((res) => {
        setNextCycleID(res.data.next_cycle_id);
        setCycleCompleted(true);
      })
      .catch((error) => {
        setError(error);
      });
  };

  const handleUpdateWorkouts = (workoutId, newExercises) => {
    setWorkouts((prevWorkouts) =>
      prevWorkouts.map((w) => {
        if (w.id !== workoutId) return w;

        const updatedExercises =
          typeof newExercises === "function"
            ? newExercises(w.workout_exercises)
            : newExercises;

        const workoutCompleted =
          updatedExercises.length > 0 &&
          updatedExercises.every(
            (ex) => ex.workout_sets.length > 0 && ex.completed
          );

        return {
          ...w,
          workout_exercises: updatedExercises,
          completed: workoutCompleted,
        };
      })
    );
  };

  const handleDeleteWorkout = (workoutId) => {
    setWorkouts((prevWorkouts) =>
      prevWorkouts.filter((w) => w.id !== workoutId)
    );
  };

  if (loading)
    return <LoadingState message={t("workout_plan_single.loading_workouts")} />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="mx-auto sm:p-8">
      {createPortal(
        <div className="bg-white/75 backdrop-blur-md shadow-md h-full w-full">
          <ProgressBar completed={completedSets} total={totalSets} />
        </div>,
        document.getElementById("progress-bar-portal")
      )}
      {workoutCycle && (
        <>
          <div className="bg-white p-6 pt-14 sm:p-0 shadow-md sm:shadow-none">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                {t("workout_plan_single.plan_label")} {workoutPlanName}
              </h1>
              <DropdownMenu
                dotsHorizontal={true}
                dotsHidden={!workoutPlanActive}
                menu={({ close }) => (
                  <WorkoutCycleDetailsMenu
                    closeMenu={close}
                    planID={planID}
                    cycleID={cycleID}
                    workoutCycle={workoutCycle}
                    setNextCycleID={setNextCycleID}
                    onError={setError}
                  />
                )}
              />
            </div>
            <h2 className="text-lg text-gray-600 mb-6">
              {t("workout_plan_single.cycle_label")}{" "}
              <span className="font-semibold">{workoutCycle.name}</span>
            </h2>
            <div className="flex flex-row gap-4 mb-8">
              <div className="w-1/2">
                {workoutCycle.previous_cycle_id && (
                  <button
                    className="btn btn-primary w-auto"
                    onClick={() =>
                      navigate(
                        `/workout-plans/${planID}/workout-cycles/${workoutCycle.previous_cycle_id}`
                      )
                    }
                  >
                    <span className="flex items-center justify-between">
                      <ArrowLeftIcon />
                      <div className="hidden sm:block">
                        {t("workout_plan_single.view_previous_cycle")}
                      </div>
                    </span>
                  </button>
                )}
              </div>
              <div className="w-1/2 text-right">
                {(workoutCycle.next_cycle_id || nextCycleID) && (
                  <button
                    className="btn btn-primary-inverted w-auto"
                    onClick={() =>
                      navigate(
                        `/workout-plans/${planID}/workout-cycles/${
                          workoutCycle.next_cycle_id || nextCycleID
                        }`
                      )
                    }
                  >
                    <span className="flex items-center justify-between">
                      <div className="hidden sm:block">
                        {t("workout_plan_single.view_next_cycle")}
                      </div>
                      <ArrowRightIcon />
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-200 sm:bg-gray-50">
            {workouts && workouts.length > 0 ? (
              <div className="space-y-6 py-6 sm:py-0">
                {workouts
                  .slice()
                  .sort((a, b) => a.index - b.index)
                  .map((workout, idx) => (
                    <div
                      key={workout.id}
                      ref={(el) => (workoutRefs.current[idx] = el)}
                    >
                      <WorkoutCard
                        planID={planID}
                        cycleID={cycleID}
                        workout={workout}
                        onDeleteWorkout={handleDeleteWorkout}
                        isCurrentCycle={!nextCycleID && workoutPlanActive}
                        onUpdateWorkouts={handleUpdateWorkouts}
                        onError={setError}
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600">
                  {t("workout_plan_single.no_workouts_found")}
                </p>
              </div>
            )}
          </div>

          {!nextCycleID && workoutPlanActive && (
            <div className="flex justify-center sm:justify-start items-center gap-4 mt-0 sm:mt-6 py-6 sm:py-0 bg-white">
              <button
                className="btn btn-primary"
                onClick={() =>
                  navigate(
                    `/workout-plans/${planID}/workout-cycles/${cycleID}/create-workout`
                  )
                }
              >
                + {t("workout_plan_single.create_workout")}
              </button>
              {!cycleCompleted && !!workouts.length && (
                <button
                  className={`btn ${
                    allWorkoutsCompleted ? "btn-success" : "btn-secondary"
                  }`}
                  onClick={handleCycleComplete}
                >
                  {t("workout_plan_single.complete_cycle")}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkoutPlanSingle;

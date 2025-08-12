import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import api from "../../api";
import WorkoutCard from "../../components/workout/WorkoutCard";
import DropdownMenu from "../../components/DropdownMenu";
import WorkoutCycleDetailsMenu from "../../components/workout/WorkoutCycleDetailsMenu";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import ProgressBar from "../../components/ProgressBar";
import { ArrowLeftIcon, ArrowRightIcon } from "../../icons/ArrowIcon";
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

  const [cycleCompleted, setCycleCompleted] = useState(false);

  const workoutRefs = useRef(new Map());
  const hasScrolled = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const ac = new AbortController();
    Promise.all([
      api.get(`workout-plans/${planID}`, { signal: ac.signal }),
      api.get(`/workout-plans/${planID}/workout-cycles/${cycleID}`, {
        signal: ac.signal,
      }),
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
        if (!ac.signal.aborted) {
          setError(error);
          console.error("Error fetching workout plan or cycle:", error);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [planID, cycleID]);

  const sortedWorkouts = useMemo(
    () => workouts.slice().sort((a, b) => a.index - b.index),
    [workouts]
  );

  useEffect(() => {
    if (hasScrolled.current || workouts.length === 0) return;
    const firstIncomplete = sortedWorkouts.find(
      (w) => !w.completed && (w.workout_exercises?.length ?? 0) > 0
    );
    if (!firstIncomplete) return;

    const ref = workoutRefs.current.get(firstIncomplete.id);
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
      hasScrolled.current = true;
    }
  }, [sortedWorkouts, workouts.length]);

  const { allSets, totalSets, completedSets, allWorkoutsCompleted } =
    useMemo(() => {
      const sets = workouts.flatMap((w) =>
        (w.workout_exercises || []).flatMap((ex) => ex.workout_sets || [])
      );
      const total = sets.length;
      const completed = sets.filter((s) => s.completed).length;
      const allCompleted =
        workouts.length > 0 && workouts.every((w) => w.completed);
      return {
        allSets: sets,
        totalSets: total,
        completedSets: completed,
        allWorkoutsCompleted: allCompleted,
      };
    }, [workouts]);

  const handleCycleComplete = useCallback(() => {
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
        console.error("Error completing cycle:", error);
      });
  }, [allWorkoutsCompleted, cycleID, planID, t]);

  const handleUpdateWorkouts = useCallback((workoutId, newExercises) => {
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
  }, []);

  const handleDeleteWorkout = useCallback((workoutId) => {
    setWorkouts((prevWorkouts) =>
      prevWorkouts.filter((w) => w.id !== workoutId)
    );
  }, []);

  const renderCycleDetailsMenu = useCallback(
    ({ close }) => (
      <WorkoutCycleDetailsMenu
        closeMenu={close}
        planID={planID}
        cycleID={cycleID}
        workoutCycle={workoutCycle}
        setNextCycleID={setNextCycleID}
        onError={setError}
      />
    ),
    [planID, cycleID, workoutCycle, setNextCycleID]
  );

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
    <>
      <div className="fixed bg-white/75 backdrop-blur-md shadow-md w-full h-2 sm:h-3 z-1">
        <ProgressBar completed={completedSets} total={totalSets} />
      </div>
      <div className="w-full sm:w-8/10 mx-auto sm:p-8">
        {workoutCycle && (
          <>
            <div className="sm:bg-transparent bg-white p-6 pt-14 sm:p-0 shadow-md sm:shadow-none">
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-title font-bold">
                  {t("workout_plan_single.plan_label")} {workoutPlanName}
                </h1>
                <DropdownMenu
                  dotsHorizontal={true}
                  dotsHidden={!workoutPlanActive}
                  menu={renderCycleDetailsMenu}
                />
              </div>
              <h2 className="text-body mb-6">
                {t("workout_plan_single.cycle_label")}{" "}
                <span className="font-semibold">{workoutCycle.name}</span>
              </h2>
              <div className="flex flex-row gap-4 mb-8">
                <div className="w-1/2">
                  {!!workoutCycle.previous_cycle_id && (
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
                  {(!!workoutCycle.next_cycle_id || !!nextCycleID) && (
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
            <div className="bg-gray-200 sm:bg-transparent">
              {workouts && workouts.length > 0 ? (
                <div className="space-y-6 py-6 sm:py-0">
                  {sortedWorkouts.map((workout, idx) => (
                    <div
                      key={workout.id}
                      ref={(el) => {
                        if (el) workoutRefs.current.set(workout.id, el);
                        else workoutRefs.current.delete(workout.id);
                      }}
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
                  <p className="text-body">
                    {t("workout_plan_single.no_workouts_found")}
                  </p>
                </div>
              )}
            </div>

            {!nextCycleID && workoutPlanActive && (
              <div className="flex justify-center sm:justify-start items-center gap-4 mt-6 py-6 sm:py-0 px-2 bg-white sm:bg-transparent">
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
    </>
  );
};

export default WorkoutPlanSingle;

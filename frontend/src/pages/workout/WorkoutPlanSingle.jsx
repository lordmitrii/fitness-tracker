import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import api from "../../api";
import WorkoutCard from "../../components/workout/WorkoutCard";
import DropdownMenu from "../../components/DropdownMenu";
import WorkoutCycleDetailsMenu from "../../components/workout/WorkoutCycleDetailsMenu";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import ProgressBar from "../../components/ProgressBar";
import { useTranslation } from "react-i18next";
import AddWorkoutExerciseModal from "../../modals/workout/AddWorkoutExerciseModal";
import { LayoutHeader } from "../../layout/LayoutHeader";

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

  const [exerciseModal, setExerciseModal] = useState(null);

  const openAddExercise = useCallback((workout) => {
    setExerciseModal({ workoutId: workout.id, workoutName: workout.name });
  }, []);

  const openReplaceExercise = useCallback(
    ({ workoutId, workoutName, exerciseId }) => {
      setExerciseModal({
        workoutId,
        workoutName,
        replaceExerciseID: exerciseId,
      });
    },
    []
  );

  const closeExerciseModal = useCallback(() => setExerciseModal(null), []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const ac = new AbortController();
    Promise.all([
      api.get(`/workout-plans/${planID}`, { signal: ac.signal }),
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
          console.error("Error fetching workout plan or cycle:", error);
          setError(error);
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [planID, cycleID]);

  const sortedWorkouts = useMemo(
    () => workouts.slice().sort((a, b) => a.index - b.index),
    [workouts]
  );

  useEffect(() => {
    if (hasScrolled.current || sortedWorkouts.length === 0) return;
    const firstIncomplete = sortedWorkouts.find(
      (w) => !w.completed && (w.workout_exercises?.length ?? 0) > 0
    );
    if (!firstIncomplete) return;

    const ref = workoutRefs.current.get(firstIncomplete.id);
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
      hasScrolled.current = true;
    }
  }, [sortedWorkouts]);

  const { totalSets, completedSets, allWorkoutsCompleted } = useMemo(() => {
    const sets = workouts.flatMap((w) =>
      (w.workout_exercises || []).flatMap((ex) => ex.workout_sets || [])
    );
    const total = sets.length;
    const completed = sets.filter((s) => s.completed).length;
    const allCompleted =
      workouts.length > 0 && workouts.every((w) => w.completed);
    return {
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
        console.error("Error completing cycle:", error);
        setError(error);
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

  const handleModalUpdate = useCallback(
    (upd) => {
      if (!exerciseModal) return;
      handleUpdateWorkouts(exerciseModal.workoutId, upd);
    },
    [exerciseModal?.workoutId, handleUpdateWorkouts]
  );

  const renderCycleDetailsMenu = useCallback(
    ({ close }) => (
      <WorkoutCycleDetailsMenu
        closeMenu={close}
        planID={planID}
        cycleID={cycleID}
        cycleName={workoutCycle?.name}
        previousCycleID={workoutCycle?.previous_cycle_id}
        nextCycleID={nextCycleID || workoutCycle?.next_cycle_id}
        setNextCycleID={setNextCycleID}
        onError={setError}
      />
    ),
    [planID, cycleID, workoutCycle, nextCycleID]
  );

  if (loading)
    return <LoadingState message={t("workout_plan_single.loading_workouts")} />;
  if (error)
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );

  return (
    <>
      <LayoutHeader disablePaddingBottom>
        <div className="px-4 min-w-0">
          <h1 className="text-title font-bold truncate">
            {t("workout_plan_single.plan_label")} {workoutPlanName}
          </h1>

          <div className="flex justify-between items-center min-w-0">
            <h2 className="text-caption min-w-0">
              {t("workout_plan_single.cycle_label")}{" "}
              <span className="font-semibold truncate">
                {workoutCycle.name}
              </span>
            </h2>
            <DropdownMenu
              dotsHorizontal={true}
              dotsHidden={false}
              menu={renderCycleDetailsMenu}
            />
          </div>
        </div>
        <div className="shadow-md w-full h-2 sm:h-3">
          <ProgressBar completed={completedSets} total={totalSets} />
        </div>
      </LayoutHeader>
      <div className="flex-1 flex flex-col sm:p-4">
        {workoutCycle && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 sm:flex-0">
              {workouts && workouts.length > 0 ? (
                <div className="flex-1 py-6 sm:py-0 flex flex-col gap-6">
                  {sortedWorkouts.map((workout) => (
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
                        onOpenAddExercise={openAddExercise}
                        onOpenReplaceExercise={openReplaceExercise}
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
              <div className="flex justify-center items-center gap-4 py-6 sm:py-0 px-2 bg-white sm:bg-transparent sm:mt-6">
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
          </div>
        )}
      </div>
      {exerciseModal && (
        <AddWorkoutExerciseModal
          onClose={closeExerciseModal}
          workoutID={exerciseModal.workoutId}
          workoutName={exerciseModal.workoutName}
          planID={planID}
          cycleID={cycleID}
          replaceExerciseID={exerciseModal.replaceExerciseID}
          onUpdateExercises={handleModalUpdate}
          onError={setError}
        />
      )}
    </>
  );
};

export default WorkoutPlanSingle;

import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import WorkoutCard from "../../components/workout/WorkoutCard";
import DropdownMenu from "../../components/DropdownMenu";
import WorkoutCycleDetailsMenu from "../../components/workout/WorkoutCycleDetailsMenu";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import ProgressBar from "../../components/ProgressBar";
import { useTranslation } from "react-i18next";
import AddWorkoutExerciseModal from "../../modals/workout/AddWorkoutExerciseModal";
import { LayoutHeader } from "../../layout/LayoutHeader";
import useWorkoutData from "../../hooks/data/useWorkoutData";
import { usePullToRefreshOverride } from "../../context/PullToRefreshContext";

const WorkoutCycle = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { planID, cycleID } = useParams();

  const workoutRefs = useRef(new Map());
  const hasScrolled = useRef(false);
  const [exerciseModal, setExerciseModal] = useState(null);

  const {
    plan,
    cycle,
    workouts,
    totalSets,
    completedSets,
    allWorkoutsCompleted,
    loading,
    error,
    refetchAll,
    mutations,
    ui,
  } = useWorkoutData({ planID, cycleID });

  usePullToRefreshOverride(
    useCallback(async () => {
      await refetchAll();
    }, [refetchAll])
  );

  useEffect(() => {
    if (hasScrolled.current || workouts.length === 0) return;
    const firstIncomplete = workouts.find(
      (w) => !w.completed && (w.workout_exercises?.length ?? 0) > 0
    );
    if (!firstIncomplete) return;

    const ref = workoutRefs.current.get(firstIncomplete.id);
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
      hasScrolled.current = true;
    }
  }, [workouts]);

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

  const handleCycleComplete = useCallback(async () => {
    if (
      !allWorkoutsCompleted &&
      !window.confirm(t("workout_plan_single.confirm_complete"))
    )
      return;

    await mutations.completeCycle.mutateAsync();
  }, [allWorkoutsCompleted, mutations.completeCycle, t]);

  const handleModalUpdate = useCallback(
    (upd) => {
      if (!exerciseModal) return;
      ui.setExercisesUI(exerciseModal.workoutId, upd);
    },
    [exerciseModal, ui.setExercisesUI]
  );

  const renderCycleDetailsMenu = useCallback(
    ({ close }) => (
      <WorkoutCycleDetailsMenu
        closeMenu={close}
        planID={planID}
        cycleID={cycleID}
        cycleName={cycle?.name}
        previousCycleID={cycle?.previous_cycle_id}
        nextCycleID={cycle?.next_cycle_id}
      />
    ),
    [planID, cycleID, cycle]
  );

  if (loading)
    return <LoadingState message={t("workout_plan_single.loading_workouts")} />;
  if (error) return <ErrorState error={error} onRetry={() => refetchAll()} />;

  return (
    <>
      <LayoutHeader disablePaddingBottom>
        <div className="px-4 min-w-0">
          <h1 className="text-title font-bold truncate">
            {t("workout_plan_single.plan_label")} {plan?.name}
          </h1>

          <div className="flex justify-between items-center min-w-0 relative">
            <h2 className="text-caption min-w-0">
              {t("workout_plan_single.cycle_label")}{" "}
              <span className="font-semibold truncate">{cycle?.name}</span>
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
        {cycle && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 sm:flex-0">
              {workouts && workouts.length > 0 ? (
                <div className="flex-1 py-6 sm:py-0 flex flex-col gap-6">
                  {workouts.map((workout) => (
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
                        isCurrentCycle={!cycle?.next_cycle_id && !!plan?.active}
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

            {!cycle?.next_cycle_id && !!plan?.active && (
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
                {!cycle?.completed && !!workouts.length && (
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
          onError={() => {}}
        />
      )}
    </>
  );
};

export default WorkoutCycle;

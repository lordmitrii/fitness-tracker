import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, use } from "react";
import api from "../api";
import WorkoutCard from "../components/WorkoutCard";
import DropdownMenu from "../components/DropdownMenu";
import WorkoutCycleDetailsMenu from "../components/WorkoutCycleDetailsMenu";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";

const WorkoutPlanSingle = () => {
  const navigate = useNavigate();
  const { planID, cycleID } = useParams();
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
    api
      .get(`/workout-plans/${planID}/workout-cycles/${cycleID}`)
      .then((res) => {
        setWorkoutCycle(res.data);
        setWorkouts(res.data.workouts);
        setCycleCompleted(res.data.completed);
        setNextCycleID(res.data.next_cycle_id);
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
        (workout) => !workout.completed
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

  const handleCycleComplete = () => {
    if (
      !allWorkoutsCompleted &&
      !window.confirm(
        `Are you sure you want to complete this cycle? Some workouts are not completed.`
      )
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

  if (loading) return <LoadingState message="Loading your stats..." />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto sm:p-8 mt-2">
        {workoutCycle && (
          <>
            {/* <h1 className="text-3xl font-bold mb-2">{workoutPlan.name}</h1> */}
            <div className="bg-white p-6 sm:p-0 shadow-md sm:shadow-none">
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                  Workout Plan View
                </h1>
                <DropdownMenu
                  dotsHorizontal={true}
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
                Cycle:{" "}
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5 8.25 12l7.5-7.5"
                          />
                        </svg>
                        <div className="hidden sm:block">View Next Cycle</div>
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
                        <div className="hidden sm:block">View Next Cycle</div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                          />
                        </svg>
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
                          isCurrentCycle={!nextCycleID}
                          onUpdateWorkouts={handleUpdateWorkouts}
                          onError={setError}
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600">
                    No workouts found for this cycle.
                  </p>
                </div>
              )}
            </div>

            {!nextCycleID && (
              <div className="flex justify-center sm:justify-start items-center gap-4 mt-0 sm:mt-6 py-6 sm:py-0 bg-white">
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    navigate(
                      `/workout-plans/${planID}/workout-cycles/${cycleID}/create-workout`
                    )
                  }
                >
                  + Create Workout
                </button>
                {!cycleCompleted && !!workouts.length && (
                  <button
                    className={`btn ${
                      allWorkoutsCompleted ? "btn-success" : "btn-secondary"
                    }`}
                    onClick={handleCycleComplete}
                  >
                    Complete Cycle
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WorkoutPlanSingle;

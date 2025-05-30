import { useParams, Link } from "react-router-dom";
import { use, useState, useEffect } from "react";
import api from "../api";

const WorkoutPlanSingle = () => {
  const { planID } = useParams();
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [currentWorkoutCycle, setCurrentWorkoutCycle] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [workouts, setWorkouts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useState(() => {
    api
      .get(`/workout-plans/${planID}`)
      .then((response) => {
        setWorkoutPlan(response.data);

        var currentCycle = response.data.current_cycle_id;
        api
          .get(`/workout-plans/${planID}/workout-cycles/${currentCycle}`)
          .then((response) => {
            setCurrentWorkoutCycle(response.data);
            setWorkouts(response.data.workouts);
          })
          .catch((error) => {
            console.error("Error fetching current workout cycle:", error);
            setError(error);
          });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching workout plan:", error);
        setError(error);
        setLoading(false);
      });
  }, [planID]);

    const handleCompleteToggle = () => {
        setIsComplete(!isComplete);
    };

    useEffect(() => {
        if (!currentWorkoutCycle) return;
        api.patch(`/workout-plans/${planID}/workout-cycles/${currentWorkoutCycle.id}`, {
            completed: isComplete,
        })
        .catch((error) => {
            console.error("Error updating workout plan:", error);
        });
    }, [isComplete, planID]);


  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

return (
    <div className="container mx-auto px-4 py-6">
        {workoutPlan && (
            <>
                <h1 className="text-2xl font-bold mb-4">
                    Workout Plan: {workoutPlan.name}
                </h1>
                {currentWorkoutCycle && (
                    <>
                        <h2 className="text-xl mb-2">
                            Current cycle: {currentWorkoutCycle.name}
                        </h2>
                        {workouts && (
                            <ul>
                                {workouts.map((workout) => (
                                    <li key={workout.id}>
                                        <Link
                                            className="text-2xl mb-4"
                                            to={`/workout-plans/${planID}/workout-cycles/${currentWorkoutCycle.id}/workouts/${workout.id}`}
                                        >
                                            Title: {workout.name}
                                        </Link>
                                        <p className="mb-4">Created at: {workout.created_at}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <label className="flex items-center mt-4">
                            <input
                                type="checkbox"
                                className="mr-2"
                                checked={isComplete}
                                onChange={handleCompleteToggle}
                            />
                            <span>Mark as complete</span>
                        </label>
                    </>
                )}
            </>
        )}
    </div>
);
};

export default WorkoutPlanSingle;

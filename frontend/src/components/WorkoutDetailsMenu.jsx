import api from "../api";
import { useNavigate } from "react-router-dom";

const WorkoutCycleDetailsMenu = ({
  closeMenu,
  planID,
  cycleID,
  workout,
  updateWorkouts,
  onDeleteWorkout,
}) => {
  const navigate = useNavigate();
  const handleUpdateWorkout = () => {
    navigate(
      `/workout-plans/${planID}/workout-cycles/${cycleID}/update-workout/${workout.id}`
    );
    closeMenu();
  };

  const handleDeleteWorkout = () => {
    if (
      !window.confirm(
        `Are you sure you want to delete workout "${workout.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    api
      .delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workout.id}`
      )
      .then(() => {
        onDeleteWorkout(workout.id);
      })
      .catch((error) => {
        alert("Error deleting workout: " + error.message);
        console.error("Error deleting workout:", error);
      });
    closeMenu();
  };

  if (!workout) return null;

  return (
    <div className="flex flex-col space-y-2 mt-2">
      <button
        className={`btn btn-secondary-light text-left`}
        onClick={handleUpdateWorkout}
      >
        <span className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6 text-gray-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
            />
          </svg>
          Update Workout
        </span>
      </button>
      <button
        className={`btn btn-danger-light text-left`}
        onClick={handleDeleteWorkout}
        title={"Delete this workout"}
      >
        <span className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6 text-pink-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
          Delete Workout
        </span>
      </button>
    </div>
  );
};

export default WorkoutCycleDetailsMenu;

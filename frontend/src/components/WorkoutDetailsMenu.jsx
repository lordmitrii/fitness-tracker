import api from "../api";
import { useNavigate } from "react-router-dom";
import UpdateIcon from "../icons/UpdateIcon";
import DeleteIcon from "../icons/DeleteIcon";

const WorkoutDetailsMenu = ({
  closeMenu,
  planID,
  cycleID,
  workout,
  updateWorkouts,
  onDeleteWorkout,
  onError,
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
        console.error("Error deleting workout:", error);
        onError(error);
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
          <UpdateIcon />
          Update Workout
        </span>
      </button>
      <button
        className={`btn btn-danger-light text-left`}
        onClick={handleDeleteWorkout}
        title={"Delete this workout"}
      >
        <span className="flex items-center gap-2">
          <DeleteIcon />
          Delete Workout
        </span>
      </button>
    </div>
  );
};

export default WorkoutDetailsMenu;

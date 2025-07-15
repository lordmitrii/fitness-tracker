import api from "../api";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "../icons/DeleteIcon";

const WorkoutCycleDetailsMenu = ({
  closeMenu,
  planID,
  cycleID,
  workoutCycle,
  setNextCycleID,
  onError,
}) => {
  const navigate = useNavigate();
  const handleDeleteCycle = () => {
    if (
      !window.confirm(
        `Are you sure you want to delete cycle "${workoutCycle.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    api
      .delete(`/workout-plans/${planID}/workout-cycles/${cycleID}`)
      .then(() => {
        navigate(
          `/workout-plans/${planID}/workout-cycles/${workoutCycle.previous_cycle_id}`
        );
        setNextCycleID(null);
      })
      .catch((error) => {
        console.error("Error deleting cycle:", error);
        onError(error);
      })
      .finally(() => {
        closeMenu();
      });
  };

  if (!workoutCycle) return null;

  return (
    <div className="flex flex-col space-y-2 mt-2">
      <button
        className={`btn btn-danger-light text-left  ${
          !workoutCycle.previous_cycle_id ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleDeleteCycle}
        disabled={!workoutCycle.previous_cycle_id}
        title={
          !workoutCycle.previous_cycle_id
            ? "Cannot delete the first cycle in a workout plan."
            : "Delete this workout cycle"
        }
      >
        <span className="flex items-center gap-2">
          <DeleteIcon />
          Delete Cycle
        </span>
      </button>
    </div>
  );
};

export default WorkoutCycleDetailsMenu;

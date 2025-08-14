import api from "../../api";
import { useNavigate } from "react-router-dom";
import UpdateIcon from "../../icons/UpdateIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import { useTranslation } from "react-i18next";

const WorkoutDetailsMenu = ({
  closeMenu,
  planID,
  cycleID,
  workoutID,
  workoutName,
  updateWorkouts,
  onDeleteWorkout,
  onError,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleUpdateWorkout = () => {
    navigate(
      `/workout-plans/${planID}/workout-cycles/${cycleID}/update-workout/${workoutID}`
    );
    closeMenu();
  };

  const handleDeleteWorkout = () => {
    if (
      !window.confirm(
        t("menus.confirm_delete_workout", {
          workoutName: workoutName,
        })
      )
    ) {
      return;
    }

    api
      .delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`
      )
      .then(() => {
        onDeleteWorkout(workoutID);
      })
      .catch((error) => {
        console.error("Error deleting workout:", error);
        onError(error);
      });
    closeMenu();
  };

  if (!workoutID) return null;

  return (
    <div className="flex flex-col space-y-2 mt-2">
      <button
        className={`btn btn-secondary-light text-left`}
        onClick={handleUpdateWorkout}
      >
        <span className="flex items-center gap-2">
          <UpdateIcon />
          {t("menus.update_workout")}
        </span>
      </button>
      <button
        className={`btn btn-danger-light text-left`}
        onClick={handleDeleteWorkout}
        title={"Delete this workout"}
      >
        <span className="flex items-center gap-2">
          <DeleteIcon />
          {t("menus.delete_workout")}
        </span>
      </button>
    </div>
  );
};

export default WorkoutDetailsMenu;

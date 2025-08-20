import { useNavigate } from "react-router-dom";
import UpdateIcon from "../../icons/UpdateIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import useWorkoutData from "../../hooks/data/useWorkoutData";

const WorkoutDetailsMenu = ({
  closeMenu,
  planID,
  cycleID,
  workoutID,
  workoutName,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const { mutations } = useWorkoutData({ planID, cycleID, skipQuery: true });

  const handleUpdateWorkout = () => {
    navigate(
      `/workout-plans/${planID}/workout-cycles/${cycleID}/update-workout/${workoutID}`
    );
    closeMenu?.();
  };

  const handleDeleteWorkout = async () => {
    if (
      !window.confirm(
        t("menus.confirm_delete_workout", {
          workoutName: workoutName,
        })
      )
    ) {
      return;
    }
    try {
      if (pending) return;
      setPending(true);
      await mutations.deleteWorkout.mutateAsync({ workoutID });
    } catch (error) {
      console.error("Error deleting workout:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
  };

  if (!workoutID) return null;

  return (
    <div className="flex flex-col space-y-2">
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
        className={`btn btn-danger-light text-left ${
          pending ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleDeleteWorkout}
        title={t("menus.delete_workout")}
        disabled={pending}
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

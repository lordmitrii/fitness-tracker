import api from "../../api";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "../../icons/DeleteIcon";
import { useTranslation } from "react-i18next";
import { memo, useCallback } from "react";

const WorkoutCycleDetailsMenu = ({
  closeMenu,
  planID,
  cycleID,
  workoutCycle,
  setNextCycleID,
  onError,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleDeleteCycle = useCallback(() => {
    if (
      !window.confirm(
        t("menus.confirm_delete_cycle", {
          cycleName: workoutCycle.name,
        })
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
  }, [
    planID,
    cycleID,
    workoutCycle,
    navigate,
    onError,
    setNextCycleID,
    closeMenu,
    t,
  ]);

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
            ? t("menus.cannot_delete_first_cycle")
            : t("menus.delete_this_cycle")
        }
      >
        <span className="flex items-center gap-2">
          <DeleteIcon />
          {t("menus.delete_cycle")}
        </span>
      </button>
    </div>
  );
};

export default memo(WorkoutCycleDetailsMenu);

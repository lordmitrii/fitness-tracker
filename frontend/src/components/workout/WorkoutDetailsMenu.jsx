import { useNavigate } from "react-router-dom";
import UpdateIcon from "../../icons/UpdateIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import useCycleData from "../../hooks/data/useCycleData";
import { MoveDownIcon, MoveUpIcon } from "../../icons/MoveIcon";

const WorkoutDetailsMenu = ({
  closeMenu,
  planID,
  cycleID,
  workoutID,
  workoutName,
  workoutOrder,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const { mutations } = useCycleData({ planID, cycleID, skipQuery: true });

  const indices = workoutOrder?.map((e) => e.index) ?? [];
  const maxIndex = indices.length ? Math.max(...indices) : 1;
  const currentIndex =
    workoutOrder.find((e) => e.id === workoutID)?.index ?? 1;
  const isOnlyWorkout = workoutOrder.length === 1;
  const isTop = currentIndex === 1;
  const isBottom = currentIndex === maxIndex;

  const handleUpdateWorkout = () => {
    navigate(
      `/workout-plans/${planID}/workout-cycles/${cycleID}/update-workout/${workoutID}`,
      { state: { name: workoutName } }
    );
    closeMenu?.();
  };

  const handleMoveUp = async () => {
    if (pending || isTop) return;
    setPending(true);
    try {
      await mutations.moveWorkout.mutateAsync({
        workoutID,
        direction: "up",
      });
    } catch (error) {
      console.error("Move workout up error:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
  };

  const handleMoveDown = async () => {
    if (pending || isOnlyWorkout || isBottom) return;
    setPending(true);
    try {
      await mutations.moveWorkout.mutateAsync({
        workoutID,
        direction: "down",
      });
    } catch (error) {
      console.error("Move workout down error:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
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
    console.log("workout Order:", workoutOrder),
    <div className="flex flex-col space-y-2">
      {!isTop && (
        <button
          className={`btn btn-secondary-light text-left
          ${pending ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleMoveUp}
          disabled={isTop || pending}
        >
          <span className="flex items-center gap-2">
            <MoveUpIcon />
            {t("menus.move_up")}
          </span>
        </button>
      )}

      {!(isOnlyWorkout || isBottom) && (
        <button
          className={`btn btn-secondary-light text-left 
          ${pending ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleMoveDown}
          disabled={isOnlyWorkout || isBottom || pending}
        >
          <span className="flex items-center gap-2">
            <MoveDownIcon />
            {t("menus.move_down")}
          </span>
        </button>
      )}
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

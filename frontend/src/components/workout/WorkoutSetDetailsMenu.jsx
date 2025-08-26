import { MoveDownIcon, MoveUpIcon } from "../../icons/MoveIcon";
import { AddRowAboveIcon, AddRowBelowIcon } from "../../icons/AddRowIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import SkipIcon from "../../icons/SkipIcon";
import useWorkoutData from "../../hooks/data/useWorkoutData";

const WorkoutSetDetailsMenu = ({
  planID,
  cycleID,
  workoutID,
  setID,
  setIndex,
  setTemplate,
  setCompleted,
  setSkipped,
  setOrder,
  exerciseID,
  closeMenu,
}) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const { mutations } = useWorkoutData({ planID, cycleID, skipQuery: true });

  const indices = setOrder?.map((s) => s.index) ?? [];
  const maxIndex = indices.length ? Math.max(...indices) : setIndex;
  const isOnlySet = indices.length === 1;
  const isTop = setIndex === 1;
  const isBottom = setIndex === maxIndex;

  const handleMoveUp = async () => {
    if (pending || isTop) return;
    setPending(true);
    try {
      await mutations.moveSet.mutateAsync({
        workoutID,
        exerciseID,
        setID,
        direction: "up",
      });
    } catch (error) {
      console.error("Error moving set up:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
  };

  const handleMoveDown = async () => {
    if (pending || isOnlySet || isBottom) return;
    setPending(true);
    try {
      await mutations.moveSet.mutateAsync({
        workoutID,
        exerciseID,
        setID,
        direction: "down",
      });
    } catch (error) {
      console.error("Error moving set down:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
  };

  const handleAddSetAbove = async () => {
    if (pending) return;
    setPending(true);
    try {
      await mutations.addSet.mutateAsync({
        workoutID,
        exerciseID,
        index: setIndex, // insert at current index (above)
        template: setTemplate,
      });
    } catch (error) {
      console.error("Error adding set above:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
  };

  const handleAddSetBelow = async () => {
    if (pending) return;
    setPending(true);
    try {
      await mutations.addSet.mutateAsync({
        workoutID,
        exerciseID,
        index: setIndex + 1, // insert after current (below)
        template: setTemplate,
      });
    } catch (error) {
      console.error("Error adding set below:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
  };

  const handleSkipSet = async () => {
    if (pending || setCompleted || setSkipped) return;
    setPending(true);
    try {
      await mutations.skipSet.mutateAsync({ workoutID, exerciseID, setID });
    } catch (error) {
      console.error("Error skipping set:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
  };

  const handleDeleteSet = async () => {
    if (pending || isOnlySet) return;
    if (!confirm(t("menus.confirm_delete_set"))) return;
    setPending(true);
    try {
      await mutations.deleteSet.mutateAsync({ workoutID, exerciseID, setID });
    } catch (error) {
      console.error("Error deleting set:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
  };

  if (!setID || !exerciseID) return null;

  return (
    <div className="flex flex-col space-y-2">
      {!isTop && (
        <button
          className={`btn btn-secondary-light text-left ${
            pending ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleMoveUp}
          disabled={isTop || pending}
        >
          <span className="flex items-center gap-2">
            <MoveUpIcon />
            {t("menus.move_up")}
          </span>
        </button>
      )}

      {!(isOnlySet || isBottom) && (
        <button
          className={`btn btn-secondary-light text-left ${
            pending ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleMoveDown}
          disabled={isOnlySet || isBottom || pending}
        >
          <span className="flex items-center gap-2">
            <MoveDownIcon />
            {t("menus.move_down")}
          </span>
        </button>
      )}

      <button
        className={`btn btn-secondary-light text-left ${
          pending ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleAddSetAbove}
      >
        <span className="flex items-center gap-2">
          <AddRowAboveIcon />
          {t("menus.add_set_above")}
        </span>
      </button>

      <button
        className={`btn btn-secondary-light text-left ${
          pending ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleAddSetBelow}
      >
        <span className="flex items-center gap-2">
          <AddRowBelowIcon />
          {t("menus.add_set_below")}
        </span>
      </button>

      {!(setCompleted || setSkipped) && (
        <button
          className={`btn btn-secondary-light text-left ${
            pending ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleSkipSet}
          disabled={pending}
        >
          <span className="flex items-center gap-2">
            <SkipIcon />
            {t("menus.skip_set")}
          </span>
        </button>
      )}

      <button
        className={`btn btn-danger-light text-left ${
          isOnlySet || pending ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleDeleteSet}
        disabled={isOnlySet || pending}
        title={
          isOnlySet
            ? t("menus.cannot_delete_only_set")
            : t("menus.delete_this_set")
        }
      >
        <span className="flex items-center gap-2">
          <DeleteIcon />
          {t("menus.delete_set")}
        </span>
      </button>
    </div>
  );
};

export default WorkoutSetDetailsMenu;

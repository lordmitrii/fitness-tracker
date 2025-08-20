import { MoveDownIcon, MoveUpIcon } from "../../icons/MoveIcon";
import ReplaceIcon from "../../icons/ReplaceIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import SkipIcon from "../../icons/SkipIcon";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import useWorkoutData from "../../hooks/data/useWorkoutData";

const WorkoutExerciseDetailsMenu = ({
  planID,
  cycleID,
  workoutID,
  exerciseID,
  exerciseOrder,
  closeMenu,
  onReplace,
  exerciseCompleted,
  exerciseSkipped,
}) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const { mutations } = useWorkoutData({
    planID,
    cycleID,
    skipQuery: true,
  });

  const indices = exerciseOrder?.map((e) => e.index) ?? [];
  const maxIndex = indices.length ? Math.max(...indices) : 1;
  const currentIndex =
    exerciseOrder.find((e) => e.id === exerciseID)?.index ?? 1;
  const isOnlyExercise = exerciseOrder.length === 1;
  const isTop = currentIndex === 1;
  const isBottom = currentIndex === maxIndex;

  const handleMoveUp = async () => {
    if (pending || isTop) return;
    setPending(true);
    try {
      await mutations.moveExercise.mutateAsync({
        workoutID,
        exerciseID,
        direction: "up",
      });
    } catch (error) {
      console.error("Move exercise up error:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
  };

  const handleMoveDown = async () => {
    if (pending || isOnlyExercise || isBottom) return;
    setPending(true);
    try {
      await mutations.moveExercise.mutateAsync({
        workoutID,
        exerciseID,
        direction: "down",
      });
    } catch (error) {
      console.error("Move exercise down error:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
  };

  const handleSkipExercise = async () => {
    if (pending) return;
    setPending(true);
    try {
      await mutations.skipExercise.mutateAsync({ workoutID, exerciseID });
    } catch (error) {
      console.error("Skip exercise error:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
  };

  const handleDeleteExercise = async () => {
    if (pending) return;
    if (!confirm(t("menus.confirm_delete_exercise"))) return;
    setPending(true);
    try {
      await mutations.deleteExercise.mutateAsync({ workoutID, exerciseID });
    } catch (error) {
      console.error("Delete exercise error:", error);
    } finally {
      setPending(false);
      closeMenu?.();
    }
  };

  if (!exerciseID) return null;

  return (
    <div className="flex flex-col space-y-2">
      <button
        className={`btn btn-secondary-light text-left ${
          isTop || pending ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleMoveUp}
        disabled={isTop || pending}
      >
        <span className="flex items-center gap-2">
          <MoveUpIcon />
          {t("menus.move_up")}
        </span>
      </button>

      <button
        className={`btn btn-secondary-light text-left ${
          isOnlyExercise || isBottom || pending
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        onClick={handleMoveDown}
        disabled={isOnlyExercise || isBottom || pending}
      >
        <span className="flex items-center gap-2">
          <MoveDownIcon />
          {t("menus.move_down")}
        </span>
      </button>

      <button
        className="btn btn-secondary-light text-left"
        onClick={() => {
          onReplace?.(exerciseID);
          closeMenu?.();
        }}
      >
        <span className="flex items-center gap-2">
          <ReplaceIcon />
          {t("menus.replace_exercise")}
        </span>
      </button>

      {!(exerciseCompleted || exerciseSkipped) && (
        <button
          className={`btn btn-secondary-light text-left ${
            pending ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleSkipExercise}
          disabled={pending}
        >
          <span className="flex items-center gap-2">
            <SkipIcon />
            {t("menus.skip_exercise")}
          </span>
        </button>
      )}

      <button
        className={`btn btn-danger-light text-left ${
          pending ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleDeleteExercise}
        disabled={pending}
      >
        <span className="flex items-center gap-2">
          <DeleteIcon />
          {t("menus.delete_exercise")}
        </span>
      </button>
    </div>
  );
};

export default WorkoutExerciseDetailsMenu;

import api from "../../api";
import { MoveDownIcon, MoveUpIcon } from "../../icons/MoveIcon";
import ReplaceIcon from "../../icons/ReplaceIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import { useTranslation } from "react-i18next";
import { withOptimisticUpdate } from "../../utils/updates";
import { useState } from "react";

const WorkoutExerciseDetailsMenu = ({
  planID,
  cycleID,
  workoutID,
  exerciseID,
  exerciseOrder,
  updateExercises,
  closeMenu,
  onError,
  onReplace,
}) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);

  const indices = exerciseOrder?.map((e) => e.index) ?? [];
  const maxIndex = indices.length ? Math.max(...indices) : 1;
  const currentIndex =
    exerciseOrder.find((e) => e.id === exerciseID)?.index ?? 1;
  const isOnlyExercise = exerciseOrder.length === 1;
  const isTop = currentIndex === 1;
  const isBottom = currentIndex === maxIndex;

  const postMove = async (direction) => {
    await api.post(
      `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/move`,
      { direction }
    );
  };

  const handleMoveUp = async () => {
    if (pending) return;
    setPending(true);

    try {
      await withOptimisticUpdate(
        updateExercises,
        (prev) => {
          const me = prev.find((e) => e.id === exerciseID);
          if (!me || me.index === 1) return prev;
          const above = prev.find((e) => e.index === me.index - 1);
          if (!above) return prev;
          return prev.map((e) =>
            e.id === me.id
              ? { ...e, index: e.index - 1 }
              : e.id === above.id
              ? { ...e, index: e.index + 1 }
              : e
          );
        },
        () => postMove("up")
      );
    } catch (error) {
      onError(error);
    } finally {
      setPending(false);
      closeMenu();
    }
  };

  const handleMoveDown = async () => {
    if (pending) return;
    setPending(true);

    try {
      await withOptimisticUpdate(
        updateExercises,
        (prev) => {
          const me = prev.find((e) => e.id === exerciseID);
          if (!me) return prev;
          const maxIndex = Math.max(...prev.map((e) => e.index));
          if (me.index === maxIndex) return prev;
          const below = prev.find((e) => e.index === me.index + 1);
          if (!below) return prev;
          return prev.map((e) =>
            e.id === me.id
              ? { ...e, index: e.index + 1 }
              : e.id === below.id
              ? { ...e, index: e.index - 1 }
              : e
          );
        },
        () => postMove("down")
      );
    } catch (error) {
      onError(error);
    } finally {
      setPending(false);
      closeMenu();
    }
  };

  const handleDeleteExercise = async () => {
    if (!confirm(t("menus.confirm_delete_exercise"))) return;
    try {
      await api.delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}`
      );
      updateExercises((prev) => {
        const me = prev.find((e) => e.id === exerciseID);
        if (!me) return prev;
        return prev
          .filter((e) => e.id !== exerciseID)
          .map((e) => (e.index > me.index ? { ...e, index: e.index - 1 } : e));
      });
    } catch (error) {
      onError(error);
    } finally {
      closeMenu();
    }
  };

  if (!exerciseID) return null;

  return (
    <div className="flex flex-col space-y-2 mt-2">
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
      <button
        className="btn btn-danger-light text-left"
        onClick={handleDeleteExercise}
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

import api from "../../api";
import { MoveDownIcon, MoveUpIcon } from "../../icons/MoveIcon";
import { AddRowAboveIcon, AddRowBelowIcon } from "../../icons/AddRowIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import { useTranslation } from "react-i18next";
import { withOptimisticUpdate } from "../../utils/updates";
import { useState } from "react";
import SkipIcon from "../../icons/SkipIcon";

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
  updateExercises,
  closeMenu,
  onError,
}) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);

  const indices = setOrder?.map((s) => s.index) ?? [];
  const maxIndex = indices.length ? Math.max(...indices) : setIndex;
  const isOnlySet = indices.length === 1;
  const isTop = setIndex === 1;
  const isBottom = setIndex === maxIndex;

  const postMove = async (direction) => {
    await api.post(
      `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}/move`,
      { direction }
    );
  };

  const handleMoveUp = async () => {
    if (pending) return;
    setPending(true);

    try {
      await withOptimisticUpdate(
        updateExercises,
        (prev) =>
          prev.map((ex) => {
            if (ex.id !== exerciseID) return ex;
            const me = ex.workout_sets.find((s) => s.id === setID);
            if (!me || me.index === 1) return ex;
            const above = ex.workout_sets.find((s) => s.index === me.index - 1);
            if (!above) return ex;
            return {
              ...ex,
              workout_sets: ex.workout_sets.map((s) =>
                s.id === me.id
                  ? { ...s, index: s.index - 1 }
                  : s.id === above.id
                  ? { ...s, index: s.index + 1 }
                  : s
              ),
            };
          }),
        () => postMove("up")
      );
    } catch (error) {
      console.error("Error moving set up:", error);
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
        (prev) =>
          prev.map((ex) => {
            if (ex.id !== exerciseID) return ex;
            const me = ex.workout_sets.find((s) => s.id === setID);
            if (!me) return ex;
            const max = Math.max(...ex.workout_sets.map((s) => s.index));
            if (me.index === max) return ex;
            const below = ex.workout_sets.find((s) => s.index === me.index + 1);
            if (!below) return ex;
            return {
              ...ex,
              workout_sets: ex.workout_sets.map((s) =>
                s.id === me.id
                  ? { ...s, index: s.index + 1 }
                  : s.id === below.id
                  ? { ...s, index: s.index - 1 }
                  : s
              ),
            };
          }),
        () => postMove("down")
      );
    } catch (error) {
      console.error("Error moving set down:", error);
      onError(error);
    } finally {
      setPending(false);
      closeMenu();
    }
  };

  const handleAddSetAbove = async () => {
    try {
      const { reps, weight, previous_weight, previous_reps } =
        setTemplate || {};
      const { data: newSet } = await api.post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets`,
        {
          workout_exercise_id: exerciseID,
          index: setIndex,
          reps,
          weight,
          previous_weight,
          previous_reps,
        }
      );
      updateExercises((prev) =>
        prev.map((ex) => {
          if (ex.id !== exerciseID) return ex;
          const currentSet = ex.workout_sets.find((s) => s.id === setID);
          const template = currentSet ?? setTemplate;
          const newSetWithClientDefaults = {
            ...newSet,
            reps: template?.reps,
            weight: template?.weight,
          };
          return {
            ...ex,
            workout_sets: [
              newSetWithClientDefaults,
              ...ex.workout_sets.map((s) =>
                s.index >= setIndex ? { ...s, index: s.index + 1 } : s
              ),
            ],
            completed: false,
          };
        })
      );
    } catch (error) {
      onError(error);
    } finally {
      closeMenu();
    }
  };

  const handleAddSetBelow = async () => {
    try {
      const { reps, weight, previous_weight, previous_reps } =
        setTemplate || {};
      const { data: newSet } = await api.post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets`,
        {
          workout_exercise_id: exerciseID,
          index: setIndex + 1,
          reps,
          weight,
          previous_weight,
          previous_reps,
        }
      );
      updateExercises((prev) =>
        prev.map((ex) => {
          if (ex.id !== exerciseID) return ex;
          const currentSet = ex.workout_sets.find((s) => s.id === setID);
          const template = currentSet ?? setTemplate;
          const newSetWithClientDefaults = {
            ...newSet,
            reps: template?.reps,
            weight: template?.weight,
          };
          return {
            ...ex,
            workout_sets: [
              ...ex.workout_sets.map((s) =>
                s.index > setIndex ? { ...s, index: s.index + 1 } : s
              ),
              newSetWithClientDefaults,
            ],
            completed: false,
          };
        })
      );
    } catch (error) {
      onError(error);
    } finally {
      closeMenu();
    }
  };

  const handleSkipSet = async () => {
    try {
      await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}/update-complete`,
        { skipped: true, completed: true }
      );
      updateExercises((prev) =>
        prev.map((item) => {
          if (item.id !== exerciseID) return item;
          const newSets = item.workout_sets.map((s) =>
            s.id === setID ? { ...s, skipped: true, completed: true } : s
          );

          const exerciseCompleted = newSets.every(
            (s) => s.completed || s.skipped
          );
          return {
            ...item,
            workout_sets: newSets,
            completed: exerciseCompleted,
          };
        })
      );
    } catch (error) {
      onError(error);
    } finally {
      closeMenu();
    }
  };

  const handleDeleteSet = async () => {
    if (!confirm(t("menus.confirm_delete_set"))) return;
    try {
      await api.delete(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exerciseID}/workout-sets/${setID}`
      );
      updateExercises((prev) =>
        prev.map((ex) => {
          if (ex.id !== exerciseID) return ex;
          const me = ex.workout_sets.find((s) => s.id === setID);
          if (!me) return ex;
          const filtered = ex.workout_sets
            .filter((s) => s.id !== setID)
            .map((s) =>
              s.index > me.index ? { ...s, index: s.index - 1 } : s
            );
          const allCompleted =
            filtered.length > 0 &&
            filtered.every((s) => s.completed || s.skipped);
          return { ...ex, workout_sets: filtered, completed: allCompleted };
        })
      );
    } catch (error) {
      onError(error);
    } finally {
      closeMenu();
    }
  };

  if (!setID || !exerciseID) return null;

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
          isOnlySet || isBottom || pending
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        onClick={handleMoveDown}
        disabled={isOnlySet || isBottom || pending}
      >
        <span className="flex items-center gap-2">
          <MoveDownIcon />
          {t("menus.move_down")}
        </span>
      </button>
      <button
        className="btn btn-secondary-light text-left"
        onClick={handleAddSetAbove}
      >
        <span className="flex items-center gap-2">
          <AddRowAboveIcon />
          {t("menus.add_set_above")}
        </span>
      </button>
      <button
        className="btn btn-secondary-light text-left"
        onClick={handleAddSetBelow}
      >
        <span className="flex items-center gap-2">
          <AddRowBelowIcon />
          {t("menus.add_set_below")}
        </span>
      </button>
      <button
        className={`btn btn-secondary-light text-left ${
          setCompleted || setSkipped ? "hidden" : ""
        }`}
        onClick={handleSkipSet}
        disabled={setCompleted || setSkipped}
      >
        <span className="flex items-center gap-2">
          <SkipIcon />
          {t("menus.skip_set")}
        </span>
      </button>
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

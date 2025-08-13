import api from "../../api";
import { MoveDownIcon, MoveUpIcon } from "../../icons/MoveIcon";
import ReplaceIcon from "../../icons/ReplaceIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import AddWorkoutExerciseModal from "../../modals/workout/AddWorkoutExerciseModal";
import { useTranslation } from "react-i18next";
import { withOptimisticUpdate } from "../../utils/updates";
import { useState } from "react";

const WorkoutExerciseDetailsMenu = ({
  planID,
  cycleID,
  workoutID,
  workoutName,
  exerciseID,
  exerciseOrder,
  updateExercises,
  closeMenu,
  onError,
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
      {/* <button
        className="btn btn-secondary-light text-left"
        onClick={handleDuplicateExercise}
      >
        <span className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6 text-gray-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
            />
          </svg>
          Duplicate Exercise
        </span>
      </button> */}
      <AddWorkoutExerciseModal
        trigger={
          <button className="btn btn-secondary-light text-left">
            <span className="flex items-center gap-2">
              <ReplaceIcon />
              {t("menus.replace_exercise")}
            </span>
          </button>
        }
        workoutID={workoutID}
        workoutName={workoutName}
        planID={planID}
        cycleID={cycleID}
        replaceExerciseID={exerciseID}
        onUpdateExercises={updateExercises}
        onError={onError}
        buttonText={t("general.replace")}
      />
      {/* <button
        className="btn btn-secondary-light text-left"
        onClick={handleReplaceExercise}
      >
        <span className="flex items-center gap-2">
          <ReplaceIcon />
          Replace Exercise
        </span>
      </button> */}
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

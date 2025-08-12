import api from "../../api";
import { MoveDownIcon, MoveUpIcon } from "../../icons/MoveIcon";
import ReplaceIcon from "../../icons/ReplaceIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import AddWorkoutExerciseModal from "../../modals/workout/AddWorkoutExerciseModal";
import { useTranslation } from "react-i18next";

const WorkoutExerciseDetailsMenu = ({
  planID,
  cycleID,
  workoutID,
  workoutName,
  exercise,
  exercises,
  updateExercises,
  closeMenu,
  onError,
}) => {
  const { t } = useTranslation();
  const handleMoveUp = () => {
    if (exercise.index === 1) {
      console.error("Already at the top");
      closeMenu();
      return;
    } // Already at the top

    api
      .post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exercise.id}/move`,
        { direction: "up" }
      )
      .then(() => {
        updateExercises((prev) => {
          const higherIndexExercise = prev.find(
            (ex) => ex.index === exercise.index - 1
          );
          if (!higherIndexExercise) return prev;
          return prev.map((ex) =>
            ex.id === exercise.id
              ? {
                  ...ex,
                  index: ex.index - 1,
                }
              : ex.id === higherIndexExercise.id
              ? {
                  ...higherIndexExercise,
                  index: higherIndexExercise.index + 1,
                }
              : ex
          );
        });
      })
      .catch((error) => {
        console.error("Error moving exercise up:", error);
        onError(error);
      });
    closeMenu();
  };

  const handleMoveDown = () => {
    const maxIndex = Math.max(...exercises.map((e) => e.index));
    if (exercise.index === maxIndex) {
      console.error("Already at the bottom");
      closeMenu();
      return;
    }
    api
      .post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exercise.id}/move`,
        { direction: "down" }
      )
      .then(() => {
        updateExercises((prev) => {
          const lowerIndexExercise = prev.find(
            (ex) => ex.index === exercise.index + 1
          );
          if (!lowerIndexExercise) return prev; // No lower index to swap with
          return prev.map((ex) =>
            ex.id === exercise.id
              ? {
                  ...ex,
                  index: ex.index + 1,
                }
              : ex.id === lowerIndexExercise.id
              ? {
                  ...lowerIndexExercise,
                  index: lowerIndexExercise.index - 1,
                }
              : ex
          );
        });
      })
      .catch((error) => {
        console.error("Error moving exercise down:", error);
        onError(error);
      });
    closeMenu();
  };

  // UNIMPLEMENTED: this thing is not working yet and may not be needed in the future
  const handleDuplicateExercise = () => {
    const newExercise = {
      ...exercise,
      id: Date.now(), // Simple ID generation
      workout_sets: exercise.workout_sets.map((set) => ({
        ...set,
        id: Date.now() + Math.random(), // Unique ID for each set
        completed: false, // Reset completed status
      })),
      completed: false,
    };
    updateExercises((prev) => [...prev, newExercise]);
    closeMenu();
  };

  const handleDeleteExercise = () => {
    if (confirm(t("menus.confirm_delete_exercise"))) {
      api
        .delete(
          `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exercise.id}`
        )
        .then(() =>
          updateExercises((prev) => {
            const filteredExercises = prev
              .filter((ex) => ex.id !== exercise.id)
              .map((ex) =>
                ex.index > exercise.index ? { ...ex, index: ex.index - 1 } : ex
              );
            return filteredExercises;
          })
        )
        .catch((error) => {
          console.error("Error deleting exercise:", error);
          onError(error);
        });
      closeMenu();
    }
  };

  if (!exercise) return null;

  return (
    <div className="flex flex-col space-y-2 mt-2">
      <button
        className={`btn btn-secondary-light text-left ${
          exercise.index === 1 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleMoveUp}
        disabled={exercise.index === 1}
      >
        <span className="flex items-center gap-2">
          <MoveUpIcon />
          {t("menus.move_up")}
        </span>
      </button>
      <button
        className={`btn btn-secondary-light text-left ${
          exercises.length === 1 ||
          exercise.index === Math.max(...exercises.map((e) => e.index))
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        onClick={handleMoveDown}
        disabled={
          exercises.length === 1 ||
          exercise.index === Math.max(...exercises.map((e) => e.index))
        }
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
        exercise={exercise}
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

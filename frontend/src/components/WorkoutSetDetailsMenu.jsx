import api from "../api";
import { MoveDownIcon, MoveUpIcon } from "../icons/MoveIcon";
import { AddRowAboveIcon, AddRowBelowIcon } from "../icons/AddRowIcon";
import DeleteIcon from "../icons/DeleteIcon";

const WorkoutSetDetailsMenu = ({
  planID,
  cycleID,
  workoutID,
  set,
  exercise,
  updateExercises,
  closeMenu,
  onError,
}) => {
  const handleMoveUp = () => {
    if (set.index === 1) {
      console.error("Already at the top");
      closeMenu();
      return; // Already at the top
    }

    api
      .post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exercise.id}/workout-sets/${set.id}/move`,
        { direction: "up" }
      )
      .then(() => {
        updateExercises((prev) => {
          // Find the set just above
          const upperSet = (exercise.workout_sets || []).find(
            (s) => s.index === set.index - 1
          );
          if (!upperSet) return prev; // Already at the top
          return prev.map((ex) => {
            if (ex.id !== exercise.id) return ex;
            return {
              ...ex,
              workout_sets: ex.workout_sets.map((s) =>
                s.id === set.id
                  ? { ...s, index: s.index - 1 }
                  : s.id === upperSet.id
                  ? { ...s, index: s.index + 1 }
                  : s
              ),
            };
          });
        });
      })
      .catch((error) => {
        console.error("Error moving set up:", error);
        onError(error);
      });
    closeMenu();
  };

  const handleMoveDown = () => {
    const maxIndex = Math.max(
      ...(exercise.workout_sets || []).map((s) => s.index)
    );
    if (set.index === maxIndex) {
      console.error("Already at the bottom");
      closeMenu();
      return; // Already at the bottom
    }

    api
      .post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exercise.id}/workout-sets/${set.id}/move`,
        { direction: "down" }
      )
      .then(() => {
        updateExercises((prev) => {
          // Find the set just below
          const lowerSet = (exercise.workout_sets || []).find(
            (s) => s.index === set.index + 1
          );
          if (!lowerSet) return prev; // Already at the bottom
          return prev.map((ex) => {
            if (ex.id !== exercise.id) return ex;
            return {
              ...ex,
              workout_sets: ex.workout_sets.map((s) =>
                s.id === set.id
                  ? { ...s, index: s.index + 1 }
                  : s.id === lowerSet.id
                  ? { ...s, index: s.index - 1 }
                  : s
              ),
            };
          });
        });
      })
      .catch((error) => {
        console.error("Error moving set down:", error);
        onError(error);
      });
    closeMenu();
  };

  const handleAddSetAbove = () => {
    api
      .post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exercise.id}/workout-sets`,
        {
          workout_exercise_id: exercise.id,
          index: set.index,
          reps: set.reps,
          weight: set.weight,
          previous_weight: set.previous_weight, // TODO: maybe remove this?
          previous_reps: set.previous_reps,
        }
      )
      .then((response) => {
        const newSet = response.data;
        updateExercises((prev) => {
          return prev.map((ex) => {
            if (ex.id !== exercise.id) return ex;
            const updatedSets = [
              newSet,
              // Increment indexes of other sets
              ...ex.workout_sets.map((s) =>
                s.index >= set.index ? { ...s, index: s.index + 1 } : s
              ),
            ];

            return { ...ex, workout_sets: updatedSets, completed: false };
          });
        });
      })
      .catch((error) => {
        console.error("Error adding set:", error);
        onError(error);
      });
    closeMenu();
  };

  const handleAddSetBelow = () => {
    api
      .post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exercise.id}/workout-sets`,
        {
          workout_exercise_id: exercise.id,
          index: set.index + 1,
          reps: set.reps,
          weight: set.weight,
          previous_weight: set.previous_weight,
          previous_reps: set.previous_reps,
        }
      )
      .then((response) => {
        const newSet = response.data;
        updateExercises((prev) => {
          return prev.map((ex) => {
            if (ex.id !== exercise.id) return ex;
            const updatedSets = [
              // Increment index if greater than set.index for existing sets
              ...ex.workout_sets.map((s) =>
                s.index > set.index ? { ...s, index: s.index + 1 } : s
              ),
              // Insert new set below
              newSet,
            ];

            return { ...ex, workout_sets: updatedSets, completed: false };
          });
        });
      })
      .catch((error) => {
        console.error("Error adding set:", error);
        onError(error);
      });
    closeMenu();
  };

  const handleDeleteSet = () => {
    if (confirm("Are you sure you want to delete this set?")) {
      api
        .delete(
          `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exercise.id}/workout-sets/${set.id}`
        )
        .then(() =>
          updateExercises((prev) => {
            return prev.map((ex) => {
              if (ex.id !== exercise.id) return ex;
              // Remove the current set
              const filteredSets = ex.workout_sets
                .filter((s) => s.id !== set.id)
                .map((s) =>
                  s.index > set.index ? { ...s, index: s.index - 1 } : s
                );

              const allOtherSetsCompleted = filteredSets.every(
                (s) => s.completed
              );

              return {
                ...ex,
                workout_sets: filteredSets,
                completed: allOtherSetsCompleted,
              };
            });
          })
        )
        .catch((error) => {
          console.error("Error deleting set:", error);
          onError(error);
        });
      closeMenu();
    }
  };

  if (!set || !exercise) return null;

  return (
    <div className="flex flex-col space-y-2 mt-2">
      <button
        className={`btn btn-secondary-light text-left ${
          set.index === 1 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleMoveUp}
        disabled={set.index === 1}
      >
        <span className="flex items-center gap-2">
          <MoveUpIcon />
          Move Up
        </span>
      </button>
      <button
        className={`btn btn-secondary-light text-left ${
          exercise.workout_sets.length === 1 ||
          set.index ===
            Math.max(...(exercise.workout_sets || []).map((s) => s.index))
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        onClick={handleMoveDown}
        disabled={
          exercise.workout_sets.length === 1 ||
          set.index ===
            Math.max(...(exercise.workout_sets || []).map((s) => s.index))
        }
      >
        <span className="flex items-center gap-2">
          <MoveDownIcon />
          Move Down
        </span>
      </button>
      <button
        className="btn btn-secondary-light text-left"
        onClick={handleAddSetAbove}
      >
        <span className="flex items-center gap-2">
          <AddRowAboveIcon />
          Add Set Above
        </span>
      </button>
      <button
        className="btn btn-secondary-light text-left"
        onClick={handleAddSetBelow}
      >
        <span className="flex items-center gap-2">
          <AddRowBelowIcon />
          Add Set Below
        </span>
      </button>
      <button
        className={`btn btn-danger-light text-left ${
          exercise.workout_sets.length === 1
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        onClick={handleDeleteSet}
        disabled={exercise.workout_sets.length === 1}
        title={
          exercise.workout_sets.length === 1
            ? "Cannot delete the last set of an exercise"
            : "Delete this set"
        }
      >
        <span className="flex items-center gap-2">
          <DeleteIcon />
          Delete Set
        </span>
      </button>
    </div>
  );
};

export default WorkoutSetDetailsMenu;

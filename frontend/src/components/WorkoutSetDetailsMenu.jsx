import api from "../api";

const WorkoutSetDetailsMenu = ({
  planID,
  cycleID,
  workoutID,
  set,
  exercise,
  updateExercises,
  closeMenu,
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
              return { ...ex, workout_sets: filteredSets };
            });
          })
        )
        .catch((error) => {
          console.error("Error deleting set:", error);
        });
      closeMenu();
    }
  };

  if (!set || !exercise) return null;

  return (
    <div className="flex flex-col space-y-1">
      <button
        className={`text-left px-3 py-2 rounded hover:bg-gray-100 ${
          set.index === 1 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleMoveUp}
        disabled={set.index === 1}
      >
        <span className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 15.75 7.5-7.5 7.5 7.5"
            />
          </svg>
          Move Up
        </span>
      </button>
      <button
        className={`text-left px-3 py-2 rounded hover:bg-gray-100 ${
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
          Move Down
        </span>
      </button>
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100"
        onClick={handleAddSetAbove}
      >
        <span className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Plus sign */}
            <path d="M12 2v6" />
            <path d="M9 5h6" />
            {/* Table rows */}
            <rect width="13" height="4" x="5.5" y="10" rx="1" />
            <rect width="13" height="4" x="5.5" y="16" rx="1" />
          </svg>
          Add Set Above
        </span>
      </button>
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100"
        onClick={handleAddSetBelow}
      >
        <span className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Table rows */}
            <rect width="13" height="4" x="5.5" y="5" rx="1" />
            <rect width="13" height="4" x="5.5" y="11" rx="1" />
            {/* Plus sign */}
            <path d="M12 17v6" />
            <path d="M9 20h6" />
          </svg>
          Add Set Below
        </span>
      </button>
      <button
        className={`text-left px-3 py-2 rounded hover:bg-gray-100 text-red-600 bg-red-50 ${
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
          Delete Set
        </span>
      </button>
    </div>
  );
};

export default WorkoutSetDetailsMenu;

const WorkoutSetDetailsMenu = ({
  set,
  exercise,
  setLocalExercises,
  closeMenu,
}) => {
  return (
    <div className="flex flex-col space-y-1">
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100"
        onClick={() => {
          setLocalExercises((prev) => {
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
          closeMenu();
        }}
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
        className="text-left px-3 py-2 rounded hover:bg-gray-100"
        onClick={() => {
          setLocalExercises((prev) => {
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
          closeMenu();
        }}
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
        onClick={() => {
          setLocalExercises((prev) => {
            return prev.map((ex) => {
              if (ex.id !== exercise.id) return ex;
              const updatedSets = [
                {
                  id: Date.now(), // Temporary ID
                  exercise_id: exercise.id,
                  index: set.index,
                  reps: set.reps || 0,
                  weight: set.weight || 0,
                  previous_weight: set.previous_weight || 0,
                  previous_reps: set.previous_reps || 0,
                  completed: false,
                },
                // Increment indexes of other sets
                ...ex.workout_sets.map((s) =>
                  s.index >= set.index ? { ...s, index: s.index + 1 } : s
                ),
              ];

              return { ...ex, workout_sets: updatedSets };
            });
          });
          closeMenu();
        }}
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
            {/* Top arrow */}
            <path d="M12 5V2" />
            <path d="M9 5l3-3 3 3" />
            {/* Table rows */}
            <rect width="13" height="4" x="5.5" y="8" rx="1" />
            <rect width="13" height="4" x="5.5" y="14" rx="1" />
          </svg>
          Add Set Above
        </span>
      </button>
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100"
        onClick={() => {
          setLocalExercises((prev) => {
            return prev.map((ex) => {
              if (ex.id !== exercise.id) return ex;
              const updatedSets = [
                // Increment index if greater than set.index for existing sets
                ...ex.workout_sets.map((s) =>
                  s.index > set.index ? { ...s, index: s.index + 1 } : s
                ),
                // Insert new set below
                {
                  id: Date.now(),
                  exercise_id: exercise.id,
                  index: set.index + 1,
                  reps: set.reps || 0,
                  weight: set.weight || 0,
                  previous_weight: set.previous_weight || 0,
                  previous_reps: set.previous_reps || 0,
                  completed: false,
                },
              ];

              return { ...ex, workout_sets: updatedSets };
            });
          });
          closeMenu();
        }}
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
            <rect width="13" height="4" x="5.5" y="6" rx="1" />
            <rect width="13" height="4" x="5.5" y="12" rx="1" />
            {/* Downward arrow */}
            <path d="M12 19v3" />
            <path d="M15 19l-3 3-3-3" />
          </svg>
          Add Set Below
        </span>
      </button>
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100 text-red-600 bg-red-50"
        onClick={() => {
          setLocalExercises((prev) => {
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
          });
          closeMenu();
        }}
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

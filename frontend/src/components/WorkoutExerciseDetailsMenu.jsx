const WorkoutExerciseDetailsMenu = ({
  exercise,
  setLocalExercises,
  closeMenu,
}) => {
  return (
    <div className="flex flex-col space-y-1">
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100 text-red-600 font-medium"
        onClick={() => {
          confirm("Are you sure you want to delete this exercise?") &&
            setLocalExercises((prev) =>
              prev.filter((ex) => ex.id !== exercise.id)
            );
          closeMenu();
        }}
      >
        Delete exercise
      </button>
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100 text-blue-600"
        onClick={() => {
          const newExercise = prompt("Enter new exercise name:");
          const newMuscleGroup = prompt("Enter new muscle group:");
          if (newExercise) {
            setLocalExercises((prev) =>
              prev.map((ex) =>
                ex.id === exercise.id
                  ? {
                      ...ex,
                      individual_exercise: {
                        ...ex.individual_exercise,
                        name: newExercise,
                        muscle_group: newMuscleGroup,
                      },
                    }
                  : ex
              )
            );
          }
          closeMenu();
        }}
      >
        Replace exercise
      </button>
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100"
        onClick={() => {
          const lastSet =
            exercise.workout_sets.length > 0
              ? exercise.workout_sets[exercise.workout_sets.length - 1]
              : null;
          const newSet = {
            id: Date.now(), // Simple ID generation
            created_at: new Date().toISOString(),
            index: exercise.workout_sets.length + 1,
            reps: 0,
            weight: 0,
            previous_weight: lastSet
              ? lastSet.weight
                ? lastSet.weight
                : lastSet.previous_weight
              : 0,
            previous_reps: lastSet
              ? lastSet.reps
                ? lastSet.reps
                : lastSet.previous_reps
              : 0,
            completed: false,
          };
          setLocalExercises((prev) =>
            prev.map((ex) =>
              ex.id === exercise.id
                ? {
                    ...ex,
                    workout_sets: [...(ex.workout_sets || []), newSet],
                  }
                : ex
            )
          );
          closeMenu();
        }}
      >
        Add Set
      </button>
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100"
        onClick={() => {
          setLocalExercises((prev) =>
            prev.map((ex) =>
              ex.id === exercise.id
                ? {
                    ...ex,
                    workout_sets: ex.workout_sets.slice(0, -1), // Remove last set
                  }
                : ex
            )
          );
          closeMenu();
        }}
      >
        Remove Set
      </button>
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100"
        onClick={() => {
          const newExercise = {
            ...exercise,
            id: Date.now(), // Simple ID generation
            workout_sets: exercise.workout_sets.map((set) => ({
              ...set,
              id: Date.now() + Math.random(), // Unique ID for each set
            })),
          };
          setLocalExercises((prev) => [...prev, newExercise]);
          closeMenu();
        }}
      >
        Duplicate
      </button>
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100"
        onClick={() => {
          setLocalExercises((prev) => {
            const higherIndexExercise = prev.find(
              (ex) => ex.index === exercise.index - 1
            );
            if (!higherIndexExercise) return prev; // No higher index to swap with
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
          closeMenu();
        }}
      >
        Move Up
      </button>
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100"
        onClick={() => {
          setLocalExercises((prev) => {
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
          closeMenu();
        }}
      >
        Move Down
      </button>
    </div>
  );
};

export default WorkoutExerciseDetailsMenu;

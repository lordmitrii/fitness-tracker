import api from "../api";

const WorkoutExerciseDetailsMenu = ({
  planID,
  cycleID,
  workoutID,
  exercise,
  localExercises,
  setLocalExercises,
  closeMenu,
}) => {
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
        setLocalExercises((prev) => {
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
      });
    closeMenu();
  };

  const handleMoveDown = () => {
    const maxIndex = Math.max(...localExercises.map(e => e.index));
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
      })
      .catch((error) => {
        console.error("Error moving exercise down:", error);
      });
    closeMenu();
  };

  const handleDuplicateExercise = () => {
    // TODO: Implement duplication logic
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
  };

  const handleReplaceExercise = () => {
    // TODO: Implement replacement logic
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
  };

  const handleDeleteExercise = () => {
    if (confirm("Are you sure you want to delete this exercise?")) {
      api
        .delete(
          `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exercise.id}`
        )
        .then(() =>
          setLocalExercises((prev) =>
            prev.filter((ex) => ex.id !== exercise.id)
          )
        )
        .catch((error) => {
          console.error("Error deleting exercise:", error);
        });
      closeMenu();
    }
  };

  if (!exercise) return null;

  return (
    <div className="flex flex-col space-y-1">
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100"
        onClick={handleMoveUp}
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
        onClick={handleMoveDown}
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
        onClick={handleDuplicateExercise}
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
              d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
            />
          </svg>
          Duplicate Exercise
        </span>
      </button>
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100"
        onClick={handleReplaceExercise}
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
              d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
            />
          </svg>
          Replace Exercise
        </span>
      </button>
      <button
        className="text-left px-3 py-2 rounded hover:bg-gray-100 text-red-600 bg-red-50"
        onClick={handleDeleteExercise}
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
          Delete Exercise
        </span>
      </button>
    </div>
  );
};

export default WorkoutExerciseDetailsMenu;

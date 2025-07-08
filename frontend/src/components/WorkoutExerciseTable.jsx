import { getExerciseProgressBadge } from "../utils/exerciseUtils";
import DropdownMenu from "./DropdownMenu";
import api from "../api";
import WorkoutExerciseDetailsMenu from "./WorkoutExerciseDetailsMenu";
import WorkoutSetDetailsMenu from "./WorkoutSetDetailsMenu";

const WorkoutExerciseTable = ({
  planID,
  cycleID,
  workoutID,
  exercises,
  isCurrentCycle,
  onUpdateExercises,
}) => {
  const handleToggleExercise = (exId, setId, reps, weight, checked) => {
    onUpdateExercises((prev) =>
      prev.map((item) => {
        if (item.id !== exId) return item;

        const newSets = item.workout_sets.map((s) =>
          s.id === setId ? { ...s, completed: checked, reps, weight } : s
        );

        const exerciseCompleted = newSets.every((s) => s.completed);

        return {
          ...item,
          workout_sets: newSets,
          completed: exerciseCompleted,
        };
      })
    );

    api
      .patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exId}/workout-sets/${setId}/update-complete`,
        { completed: checked }
      )
      .catch((error) => {
        setError(error);
      });

    // If the set is not completed, we don't need to update sets, reps, and weight
    if (!checked) return;

    api
      .patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exId}/workout-sets/${setId}`,
        { reps, weight }
      )
      .catch((error) => {
        setError(error);
      });
  };

  const checkInputFields = (set) => {
    if (
      typeof set.reps !== "number" ||
      typeof set.weight !== "number" ||
      isNaN(set.reps) ||
      isNaN(set.weight)
    ) {
      return false;
    }
    if (set.reps <= 0 || set.weight < 0) {
      return false;
    }
    if (!Number.isInteger(set.reps)) {
      return false;
    }
    return true;
  };

  return (
    <div className="flex flex-col gap-6 bg-gray-50 sm:p-4 rounded-lg shadow-md">
      {exercises
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((ex) => (
          <div
            key={ex.id}
            className="rounded-2xl sm:shadow bg-white sm:p-4 flex flex-col gap-4 sm:border sm:border-gray-100"
          >
            {/* Exercise header */}
            <div className="flex flex-row items-start sm:items-center justify-between gap-1">
              <div className="font-bold text-lg text-blue-700">
                {ex.index}. {ex.individual_exercise.name}
                <span className="ml-2 text-gray-600 text-base font-normal">
                  ({ex.individual_exercise.muscle_group})
                </span>
              </div>
              <DropdownMenu
                isLeft={false}
                menu={({ close }) => (
                  <WorkoutExerciseDetailsMenu
                    planID={planID}
                    cycleID={cycleID}
                    workoutID={workoutID}
                    exercise={ex}
                    exercises={exercises}
                    updateExercises={onUpdateExercises}
                    closeMenu={close}
                  />
                )}
              />
            </div>

            {/* Sets table */}
            <div className="overflow-x-auto">
              <div className="min-w-full grid grid-cols-[36px_1fr_1fr_1fr_1fr] sm:grid-cols-[36px_1fr_1fr_1fr_1fr_1fr] gap-4 text-gray-600 font-semibold border-b pb-2">
                <div className=""></div>
                <div className="hidden sm:block">Set</div>
                <div className="">Reps</div>
                <div className="">Weight (kg)</div>
                <div className="invisible sm:visible text-center">Badge</div>
                <div className="">Done</div>
              </div>
              <div className="flex flex-col divide-y">
                {(ex.workout_sets || [])
                  .sort((a, b) => a.index - b.index)
                  .map((set) => (
                    <div
                      key={set.id}
                      className="min-w-full grid grid-cols-[36px_1fr_1fr_1fr_1fr] sm:grid-cols-[36px_1fr_1fr_1fr_1fr_1fr] gap-4 items-center py-2"
                    >
                      <DropdownMenu
                        isLeft={true}
                        menu={({ close }) => (
                          <WorkoutSetDetailsMenu
                            planID={planID}
                            cycleID={cycleID}
                            workoutID={workoutID}
                            set={set}
                            exercise={ex}
                            updateExercises={onUpdateExercises}
                            closeMenu={close}
                          />
                        )}
                      />
                      <div className="hidden sm:block font-medium text-gray-700">
                        {set.index}
                      </div>
                      <input
                        type="number"
                        placeholder={set.previous_reps}
                        value={set.reps || ""}
                        min={1}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          onUpdateExercises((prev) =>
                            prev.map((item) =>
                              item.id === ex.id
                                ? {
                                    ...item,
                                    workout_sets: item.workout_sets.map((s) =>
                                      s.index === set.index
                                        ? {
                                            ...s,
                                            reps: value,
                                            completed: false,
                                          }
                                        : s
                                    ),
                                  }
                                : item
                            )
                          );
                        }}
                        className={`w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:italic ${
                          set.completed || !isCurrentCycle
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={!isCurrentCycle}
                      />
                      <input
                        type="number"
                        placeholder={set.previous_weight}
                        value={set.weight || ""}
                        min={0}
                        inputMode="decimal"
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          onUpdateExercises((prev) =>
                            prev.map((item) =>
                              item.id === ex.id
                                ? {
                                    ...item,
                                    workout_sets: item.workout_sets.map((s) =>
                                      s.index === set.index
                                        ? {
                                            ...s,
                                            weight: value,
                                            completed: false,
                                          }
                                        : s
                                    ),
                                  }
                                : item
                            )
                          );
                        }}
                        className={`w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:italic ${
                          set.completed || !isCurrentCycle
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={!isCurrentCycle}
                      />
                      <span className="text-gray-500 text-sm w-5 justify-self-center">
                        {getExerciseProgressBadge(set)}
                      </span>
                      <input
                        type="checkbox"
                        checked={!!set.completed}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked && !checkInputFields(set)) {
                            alert(
                              "Please ensure all fields are valid before marking as done."
                            );
                            return;
                          }
                          handleToggleExercise(
                            ex.id,
                            set.id,
                            set.reps,
                            set.weight,
                            checked
                          );
                        }}
                        className="form-checkbox accent-blue-600 h-5 w-5"
                        title="Set completed"
                        disabled={!isCurrentCycle}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default WorkoutExerciseTable;

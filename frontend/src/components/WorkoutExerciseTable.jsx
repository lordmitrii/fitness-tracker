import { useState, useEffect } from "react";
import { getExerciseProgressBadge } from "../utils/exerciseUtils";
import DropdownMenu from "./DropdownMenu";
import WorkoutExerciseDetailsMenu from "./WorkoutExerciseDetailsMenu";

const WorkoutExerciseTable = ({ exercises, onToggle, isCurrentCycle }) => {
  const [localExercises, setLocalExercises] = useState(exercises || []);

  useEffect(() => {
    setLocalExercises(exercises);
  }, [exercises]);

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
      {localExercises
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
                menu={({ close }) => (
                  <WorkoutExerciseDetailsMenu
                    exercise={ex}
                    setLocalExercises={setLocalExercises}
                    closeMenu={close}
                  />
                )}
              />
            </div>

            {/* Sets table */}
            <div className="overflow-x-auto">
              <div className="min-w-full grid grid-cols-4 sm:grid-cols-5 gap-4 text-gray-600 font-semibold border-b pb-2">
                <div className="hidden sm:block">Set</div>
                <div className="">Reps</div>
                <div className="">Weight (kg)</div>
                <div className="invisible sm:visible text-center">Badge</div>
                <div className="">Done</div>
              </div>
              <div className="flex flex-col divide-y">
                {(ex.workout_sets || [])
                  .sort((a, b) => a.index - b.index)
                  .map((set, setIdx) => (
                    <div
                      key={set.id}
                      className="min-w-full grid grid-cols-4 sm:grid-cols-5 gap-4 items-center py-2"
                    >
                      <div className="hidden sm:block font-medium text-gray-700">
                        {setIdx + 1}
                      </div>
                      <input
                        type="number"
                        placeholder={set.previous_reps}
                        value={set.reps || ""}
                        min={1}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setLocalExercises((prev) =>
                            prev.map((item) =>
                              item.id === ex.id
                                ? {
                                    ...item,
                                    workout_sets: item.workout_sets.map(
                                      (s, sIdx) =>
                                        sIdx === setIdx
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
                          setLocalExercises((prev) =>
                            prev.map((item) =>
                              item.id === ex.id
                                ? {
                                    ...item,
                                    workout_sets: item.workout_sets.map(
                                      (s, sIdx) =>
                                        sIdx === setIdx
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
                          setLocalExercises((prev) =>
                            prev.map((item) =>
                              item.id === ex.id
                                ? {
                                    ...item,
                                    workout_sets: item.workout_sets.map(
                                      (s, sIdx) =>
                                        sIdx === setIdx
                                          ? { ...s, completed: checked }
                                          : s
                                    ),
                                  }
                                : item
                            )
                          );
                          onToggle(
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

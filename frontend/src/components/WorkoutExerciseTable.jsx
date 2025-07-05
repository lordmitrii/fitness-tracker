import React, { useState, useEffect } from "react";
import { getExerciseProgressBadge } from "../utils/exerciseUtils";

const WorkoutExerciseTable = ({ exercises, onToggle, isCurrentCycle }) => {
  const [localExercises, setLocalExercises] = useState(exercises || []);

  useEffect(() => {
    setLocalExercises(exercises);
  }, [exercises]);

  const checkInputFields = (ex) => {
    if (
      typeof ex.reps !== "number" ||
      typeof ex.weight !== "number" ||
      isNaN(ex.reps) ||
      isNaN(ex.weight)
    ) {
      return false;
    }
    if (ex.reps <= 0 || ex.weight < 0) {
      return false;
    }
    if (!Number.isInteger(ex.reps)) {
      return false;
    }
    return true;
  };

  return (
    <table className="min-w-full bg-gray-50 rounded-xl">
      <tbody>
        {localExercises
          .slice()
          .sort((a, b) => a.index - b.index)
          .map((ex) => (
            <React.Fragment key={ex.id}>
              <tr>
                <td
                  colSpan={5}
                  className="py-3 px-4 font-bold text-lg border-b"
                >
                  {ex.index}. {ex.individual_exercise.name}
                  <span className="ml-2 text-gray-600 text-base font-normal">
                    ({ex.individual_exercise.muscle_group})
                  </span>
                </td>
              </tr>
              {/* Sets Table Header */}
              <tr>
                <th className="py-2 px-4 text-left font-semibold text-gray-700">
                  Set
                </th>
                <th className="py-2 px-4 text-left font-semibold text-gray-700">
                  Reps
                </th>
                <th className="py-2 px-4 text-left font-semibold text-gray-700">
                  Weight
                </th>
                <th className="py-2 px-4 text-left font-semibold text-gray-700">
                  Badge
                </th>
                <th className="py-2 px-4 text-left font-semibold text-gray-700">
                  Done
                </th>
              </tr>
              {/* Sets Table Rows */}
              {(ex.workout_sets || [])
                .sort((a, b) => a.index - b.index)
                .map((set, setIdx) => (
                  <tr
                    key={set.id}
                    className={
                      setIdx % 2 === 0
                        ? "bg-white border-b last:border-0"
                        : "bg-gray-100 border-b last:border-0"
                    }
                  >
                    <td className="py-2 px-4">#{setIdx + 1}</td>
                    <td className="py-2 px-4">
                      <input
                        type="number"
                        placeholder={set.previous_reps}
                        value={set.reps || ""}
                        onChange={(e) => {
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
                                              reps: Number(e.target.value),
                                              completed: false,
                                            }
                                          : s
                                    ),
                                  }
                                : item
                            )
                          );
                        }}
                        className={
                          set.completed || !isCurrentCycle
                            ? "w-16 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-50 cursor-not-allowed focus:cursor-auto focus:opacity-100"
                            : "placeholder:italic w-16 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        }
                        disabled={!isCurrentCycle}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="number"
                        placeholder={set.previous_weight}
                        value={set.weight || ""}
                        onChange={(e) => {
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
                                              weight: Number(e.target.value),
                                              completed: false,
                                            }
                                          : s
                                    ),
                                  }
                                : item
                            )
                          );
                        }}
                        className={
                          set.completed || !isCurrentCycle
                            ? "w-16 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-50 cursor-not-allowed focus:cursor-auto focus:opacity-100"
                            : "placeholder:italic w-16 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        }
                        disabled={!isCurrentCycle}
                      />
                    </td>
                    <td className="py-2 px-4">
                      {getExerciseProgressBadge(set)}
                    </td>
                    <td className="py-2 px-4">
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
                    </td>
                  </tr>
                ))}
            </React.Fragment>
          ))}
      </tbody>
    </table>
  );
};

export default WorkoutExerciseTable;

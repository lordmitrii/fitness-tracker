import { useState, useEffect } from "react";
import { getExerciseProgressBadge } from "../utils/exerciseUtils";

const WorkoutExerciseTable = ({ exercises, onToggle, isCurrentCycle }) => {
  const [localExercises, setLocalExercises] = useState(exercises || []);

  useEffect(() => {
    setLocalExercises(exercises);
  }, [exercises]);

  const checkInputFields = (ex) => {
    if (
      typeof ex.sets !== "number" ||
      typeof ex.reps !== "number" ||
      typeof ex.weight !== "number" ||
      isNaN(ex.sets) ||
      isNaN(ex.reps) ||
      isNaN(ex.weight)
    ) {
      return false;
    }
    if (ex.sets <= 0 || ex.reps <= 0 || ex.weight < 0) {
      return false;
    }
    if (!Number.isInteger(ex.sets) || !Number.isInteger(ex.reps)) {
      return false;
    }
    return true;
  };

  return (
    <table className="min-w-full bg-gray-50 rounded-xl">
      <thead>
        <tr>
          <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-1/40">
            Done
          </th>
          <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-14/40">
            Exercise
          </th>
          <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-2/10">
            Sets
          </th>
          <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-2/10">
            Reps
          </th>
          <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-2/10">
            Weight
          </th>
          <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-1/40">
            Badge
          </th>
        </tr>
      </thead>
      <tbody>
        {localExercises
          .slice()
          .sort((a, b) => a.index - b.index)
          .map((ex, idx) => (
            <tr
              key={ex.id}
              className={
                idx % 2 === 0
                  ? "bg-white border-b last:border-0"
                  : "bg-gray-100 border-b last:border-0"
              }
            >
              <td className="py-2 px-4">
                <input
                  type="checkbox"
                  checked={!!ex.completed}
                  className="form-checkbox accent-blue-600 h-5 w-5"
                  title="Exercise completed"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (checked && !checkInputFields(ex)) {
                      alert(
                        "Please fill in valid sets, reps, and weight before completing this exercise."
                      );
                      return;
                    }
                    setLocalExercises((prev) =>
                      prev.map((item) =>
                        item.id === ex.id
                          ? { ...item, completed: checked }
                          : item
                      )
                    );
                    onToggle(ex.id, ex.sets, ex.reps, ex.weight, checked);
                  }}
                  disabled={!isCurrentCycle}
                />
              </td>
              <td className="py-2 px-4">{ex.individual_exercise.name}</td>
              <td className="py-2 px-4">
                <input
                  type="number"
                  placeholder={ex.previous_sets}
                  value={ex.sets || ""}
                  onChange={(e) => {
                    setLocalExercises((prev) =>
                      prev.map((item) =>
                        item.id === ex.id
                          ? {
                              ...item,
                              completed: false,
                              sets: Number(e.target.value),
                            }
                          : item
                      )
                    );
                  }}
                  className={
                    ex.completed
                      ? "w-16 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-50 cursor-not-allowed focus:cursor-auto focus:opacity-100"
                      : "placeholder:italic w-16 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  }
                  disabled={!isCurrentCycle}
                />
              </td>
              <td className="py-2 px-4">
                <input
                  type="number"
                  placeholder={ex.previous_reps}
                  value={ex.reps || ""}
                  onChange={(e) => {
                    setLocalExercises((prev) =>
                      prev.map((item) =>
                        item.id === ex.id
                          ? {
                              ...item,
                              completed: false,
                              reps: Number(e.target.value),
                            }
                          : item
                      )
                    );
                  }}
                  className={
                    ex.completed
                      ? "w-16 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-50 cursor-not-allowed focus:cursor-auto focus:opacity-100"
                      : "placeholder:italic w-16 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  }
                  disabled={!isCurrentCycle}
                />
              </td>
              <td className="py-2 px-4">
                <input
                  type="number"
                  placeholder={ex.previous_weight}
                  value={ex.weight || ""}
                  onChange={(e) => {
                    setLocalExercises((prev) =>
                      prev.map((item) =>
                        item.id === ex.id
                          ? {
                              ...item,
                              completed: false,
                              weight: Number(e.target.value),
                            }
                          : item
                      )
                    );
                  }}
                  className={
                    ex.completed
                      ? "w-16 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-50 cursor-not-allowed focus:cursor-auto focus:opacity-100"
                      : "placeholder:italic w-16 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  }
                  disabled={!isCurrentCycle}
                />
              </td>
              <td className="py-2 px-4">{getExerciseProgressBadge(ex)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};

export default WorkoutExerciseTable;

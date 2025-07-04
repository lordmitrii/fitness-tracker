import { useState, useEffect } from "react";
import api from "../api";

const AddWorkoutExerciseModal = ({ open, onClose, onSave, workout }) => {
  const [exercisesArray, setExercisesArray] = useState([]);
  const [exercisesFetched, setExercisesFetched] = useState(false);

  const [makingCustomExercise, setMakingCustomExercise] = useState(false);

  const [exerciseID, setExerciseID] = useState("");
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  // Fetch exercises when the modal opens
  useEffect(() => {
    if (exercisesFetched) return;

    let isMounted = true;
    Promise.all([api.get("exercises/"), api.get("individual-exercises")])
      .then(([res1, res2]) => {
        if (isMounted) {
          const merged = [
            ...res1.data.map((ex) => ({ ...ex, source: "pool" })),
            ...res2.data
              .filter((ex) => !ex.exercise_id)
              .map((ex) => ({ ...ex, source: "custom" })),
          ];
          setExercisesArray(merged);
          setExercisesFetched(true);
        }
      })
      .catch((err) => {
        console.error("Error fetching exercises:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [exercisesFetched]);

  useEffect(() => {
    // Reset form fields when modal opens
    if (open) {
      setExerciseID("");
      setName("");
      setMuscleGroup("");
      setSets("");
      setReps("");
      setWeight("");
    }
  }, [open, workout, makingCustomExercise]);

  if (!open || !workout) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    let source, id;
    if (exerciseID) [source, id] = String(exerciseID).split("-");

    if (makingCustomExercise) {
      onSave({
        exercise: { name, muscle_group: muscleGroup },
        sets,
        reps,
        weight,
      });
      return;
    }

    const exObj = exercisesArray.find(
      (ex) => `${ex.source}-${ex.id}` === exerciseID
    );

    if (!exObj) {
      console.error("Selected exercise not found in the list.");
      return;
    }

    if (source === "pool") {
      onSave({ exercise: { id: exObj.id }, sets, reps, weight });
    }
    // If picked from custom, send name and muscle group only
    else {
      onSave({
        exercise: { name: exObj.name, muscle_group: exObj.muscle_group },
        sets,
        reps,
        weight,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 min-w-[340px]">
        <h3 className="text-xl font-bold mb-4">
          Add Exercise to {workout.name}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {!makingCustomExercise ? (
            <select
              className="border rounded p-2"
              value={exerciseID}
              onChange={(e) => setExerciseID(e.target.value)}
              required
            >
              <option value="" disabled>
                Select Exercise
              </option>
              {exercisesArray.map((ex) => (
                <option
                  key={`${ex.source}-${ex.id}`}
                  value={`${ex.source}-${ex.id}`}
                >
                  {ex.name}
                  {ex.source === "custom" ? " (custom)" : ""}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                className="border rounded p-2"
                type="text"
                placeholder="Exercise Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className="border rounded p-2"
                type="text"
                placeholder="Muscle Group"
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                required
              />
            </div>
          )}
          <input
            className="border rounded p-2"
            type="number"
            placeholder="Sets"
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
            min={1}
            required
          />
          <input
            className="border rounded p-2"
            type="number"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            min={1}
            required
          />
          <input
            className="border rounded p-2"
            type="number"
            placeholder="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            min={0}
            required
          />
          <button
            type="button"
            className="text-blue-600 hover:underline mb-2"
            onClick={() => setMakingCustomExercise(!makingCustomExercise)}
          >
            {!makingCustomExercise
              ? "Create custom exercise"
              : "Select from exercise pool"}
          </button>
          <div className="flex gap-2 justify-between mt-3">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Exercise
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkoutExerciseModal;

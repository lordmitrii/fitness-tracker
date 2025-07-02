import { useState, useEffect } from "react";
import api from "../api"; // Adjust the import path as necessary

const AddExerciseModal = ({ open, onClose, onSave, workout }) => {
  const [exercisesArray, setExercisesArray] = useState([]);
  const [exercisesFetched, setExercisesFetched] = useState(false);

  const [exerciseID, setExerciseID] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  // Fetch exercises when the modal opens
  useEffect(() => {
    if (exercisesFetched) return;
    api
      .get("exercises/")
      .then((res) => {
        setExercisesArray(res.data);
        setExercisesFetched(true);
      })
      .catch((error) => {
        console.error("Error fetching exercises:", error);
      });
  }, [exercisesFetched]);

  useEffect(() => {
    // Reset form fields when modal opens
    if (open) {
      setExerciseID("");
      setSets("");
      setReps("");
      setWeight("");
    }
  }, [open, workout]);

  if (!open || !workout) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedExerciseObj = exercisesArray.find((ex) => ex.id === exerciseID);
    onSave({ exercise: selectedExerciseObj, sets, reps, weight });
  };

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 min-w-[340px]">
        <h3 className="text-xl font-bold mb-4">
          Add Exercise to {workout.name}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <select
            className="border rounded p-2"
            value={exerciseID}
            onChange={(e) => setExerciseID(Number(e.target.value))}
            required
          >
            <option value="" disabled>
              Select Exercise
            </option>
            {exercisesArray.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
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

export default AddExerciseModal;

import { useState, useEffect, useRef } from "react";
import api from "../api";
import { cloneElement } from "react";
import Spinner from "./Spinner";

const AddWorkoutExerciseModal = ({
  open: openProp,
  onOpenChange,
  trigger,
  workoutID,
  workoutName,
  planID,
  cycleID,
  onUpdateExercises,
  onError,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = openProp !== undefined && onOpenChange;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const close = () => setOpen(false);

  const modalRef = useRef(null);
  const [exercisesArray, setExercisesArray] = useState([]);
  const [muscleGroupsArray, setMuscleGroupsArray] = useState([]);
  const [exercisesFetched, setExercisesFetched] = useState(false);

  const [loading, setLoading] = useState(false);

  const [makingCustomExercise, setMakingCustomExercise] = useState(false);

  const [exerciseID, setExerciseID] = useState("");
  const [name, setName] = useState("");
  const [muscleGroupID, setMuscleGroupID] = useState("");
  const [sets, setSets] = useState("");

  // Fetch exercises when the modal opens
  useEffect(() => {
    if (!open || exercisesFetched) return;

    setLoading(true);
    const ac = new AbortController();

    Promise.all([
      api.get("exercises/", { signal: ac.signal }),
      api.get("individual-exercises", { signal: ac.signal }),
      api.get("muscle-groups/", { signal: ac.signal }),
    ])
      .then(([res1, res2, res3]) => {
        const merged = [
          ...res1.data.map((ex) => ({ ...ex, source: "pool" })),
          ...res2.data
            .filter((ex) => !ex.exercise_id)
            .map((ex) => ({ ...ex, source: "custom" })),
        ];
        setMuscleGroupsArray(res3.data);
        setExercisesArray(merged);
        setExercisesFetched(true);
      })
      .catch((err) => {
        if (!ac.signal.aborted) onError(err);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [open]);

  useEffect(() => {
    function handleClick(e) {
      if (open && modalRef.current && !modalRef.current.contains(e.target)) {
        close();
      }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open]);

  useEffect(() => {
    // Reset form fields when modal opens
    if (open) {
      setExerciseID("");
      setName("");
      setMuscleGroupID("");
      setSets("");
      setMakingCustomExercise(false);
    }
  }, [open, workoutID, makingCustomExercise]);

  const handleSubmit = (e) => {
    e.preventDefault();

    let source, id;
    if (exerciseID) [source, id] = String(exerciseID).split("-");

    if (makingCustomExercise) {
      handleSaveNewExercise({ name, muscle_group_id: muscleGroupID }, sets);
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
      handleSaveNewExercise({ id: exObj.id }, sets);
    }
    // If picked from custom, send name and muscle group only
    else {
      handleSaveNewExercise(
        { name: exObj.name, muscle_group_id: exObj.muscle_group_id },
        sets
      );
    }
  };

  const handleSaveNewExercise = async (newExercise, sets) => {
    try {
      const { data: individualExercise } = await api.post(
        "individual-exercises",
        {
          exercise_id: newExercise.id,
          name: newExercise.name,
          muscle_group_id: newExercise.muscle_group_id,
        }
      );

      const { data: workoutExercise } = await api.post(
        `workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises`,
        { individual_exercise_id: individualExercise.id, sets_qt: sets }
      );

      onUpdateExercises((prev) => [
        ...prev,
        { ...workoutExercise, individual_exercise: individualExercise },
      ]);

      close();
    } catch (error) {
      console.error("Error saving new exercise:", error);
      onError(error);
    }
  };

  return (
    <>
      {trigger ? cloneElement(trigger, { onClick: () => setOpen(true) }) : null}
      {open && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex justify-center items-center z-50">
          <div
            ref={modalRef}
            className="relative bg-white rounded-2xl shadow-lg p-8 min-w-sm sm:min-w-lg"
          >
            {loading && (
              <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center z-10 rounded-2xl">
                <Spinner />
              </div>
            )}

            <h3 className="text-xl font-bold mb-4">
              Add Exercise to {workoutName}
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
                  <select
                    className="border rounded p-2"
                    value={muscleGroupID}
                    onChange={(e) => setMuscleGroupID(Number(e.target.value))}
                    required
                  >
                    <option value="" disabled>
                      Select Muscle Group
                    </option>
                    {muscleGroupsArray.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
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
                  className="btn btn-secondary"
                  onClick={close}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Add Exercise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddWorkoutExerciseModal;

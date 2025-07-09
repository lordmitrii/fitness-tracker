import { useState, useEffect } from "react";
import api from "../api";

const AddWorkoutExerciseModal = ({
  workout,
  planID,
  cycleID,
  onUpdateWorkouts,
  onError,
}) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const [exercisesArray, setExercisesArray] = useState([]);
  const [musclGroupsArray, setMuscleGroupsArray] = useState([]);
  const [exercisesFetched, setExercisesFetched] = useState(false);

  const [makingCustomExercise, setMakingCustomExercise] = useState(false);

  const [exerciseID, setExerciseID] = useState("");
  const [name, setName] = useState("");
  const [muscleGroupID, setMuscleGroupID] = useState("");
  const [sets, setSets] = useState("");

  // Fetch exercises when the modal opens
  useEffect(() => {
    if (exercisesFetched) return;

    let isMounted = true;
    Promise.all([
      api.get("exercises/"),
      api.get("individual-exercises"),
      api.get("muscle-groups/"),
    ])
      .then(([res1, res2, res3]) => {
        if (isMounted) {
          const merged = [
            ...res1.data.map((ex) => ({ ...ex, source: "pool" })),
            ...res2.data
              .filter((ex) => !ex.exercise_id)
              .map((ex) => ({ ...ex, source: "custom" })),
          ];
          setMuscleGroupsArray(res3.data);
          setExercisesArray(merged);
          setExercisesFetched(true);
        }
      })
      .catch((err) => {
        console.error("Error fetching exercises:", err);
        if (isMounted) {
          onError(err);
        }
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
      setMuscleGroupID("");
      setSets("");
    }
  }, [open, workout, makingCustomExercise]);

  const handleSubmit = (e) => {
    e.preventDefault();

    let source, id;
    if (exerciseID) [source, id] = String(exerciseID).split("-");

    if (makingCustomExercise) {
      handleSaveNewExercise({
        exercise: { name, muscle_group_id: muscleGroupID },
        sets,
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
      handleSaveNewExercise({ exercise: { id: exObj.id }, sets });
    }
    // If picked from custom, send name and muscle group only
    else {
      handleSaveNewExercise({
        exercise: { name: exObj.name, muscle_group_id: exObj.muscle_group_id },
        sets,
      });
    }
  };

  const handleSaveNewExercise = (newExercise) => {
    api
      .post(`individual-exercise1s`, {
        exercise_id: newExercise.exercise.id,
        name: newExercise.exercise.name,
        muscle_group_id: newExercise.exercise.muscle_group_id,
      })
      .then((res1) => {
        delete newExercise.exercise; // Remove the exercise object to match the API structure
        const individualExercise = res1.data;
        api
          .post(
            `workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workout.id}/workout-exercises`,
            {
              individual_exercise_id: individualExercise.id,
              sets_qt: newExercise.sets,
            }
          )
          .then((res2) => {
            const exerciseToAdd = {
              ...res2.data,
              individual_exercise: individualExercise,
            };
            onUpdateWorkouts(workout.id, (prevExercises) => [
              ...prevExercises,
              exerciseToAdd,
            ]);
            close();
          })
          .catch((error) => {
            console.error("Error adding exercise to workout:", error);
            onError(error);
          });
      })
      .catch((error) => {
        console.error("Error saving new exercise:", error);
        onError(error);
        return;
      });
  };

  return (
    <>
      <button
        className="btn btn-primary flex items-center justify-center w-full sm:w-auto"
        onClick={() => setOpen((o) => !o)}
      >
        <span>+ Add Exercise</span>
      </button>
      {open && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 min-w-sm sm:min-w-lg">
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
                  <select
                    className="border rounded p-2"
                    value={muscleGroupID}
                    onChange={(e) => setMuscleGroupID(Number(e.target.value))}
                    required
                  >
                    <option value="" disabled>
                      Select Muscle Group
                    </option>
                    {musclGroupsArray.map((group) => (
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
                <button type="submit" className="btn btn-primary">
                  Add Exercise
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

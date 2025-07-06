import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

const WorkoutForm = ({ initialData = {}, onSubmit, submitLabel,  }) => {
  const [formData, setFormData] = useState({
    name: "",
    ...initialData,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Workout name is required.";
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
    };

    onSubmit(payload);
  };

  return (
    <div className="min-h-screen items-center bg-gray-50 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 flex flex-col gap-6">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-800">
          {submitLabel}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-lg font-medium text-gray-700 mb-1"
            >
              Workout Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter workout name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold"
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
};

// Create workout page
export const CreateWorkoutForm = () => {
  const { planID, cycleID } = useParams();
  const navigate = useNavigate();

  const handleCreate = (payload) => {
    api
      .post(`/workout-plans/${planID}/workout-cycles/${cycleID}/workouts`, payload)
      .then(() => {
        navigate(`/workout-plans/${planID}/workout-cycles/${cycleID}`);
      })
      .catch((error) => {
        console.error("Error creating workout:", error);
      });
  };

  return <WorkoutForm onSubmit={handleCreate} submitLabel="Create Workout" />;
};

// Update workout page
export const UpdateWorkoutForm = () => {
  const { planID, cycleID, workoutID } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    api
      .get(`/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`)
      .then((response) => {
        const data = response.data;
        setInitialData({
          name: data.name || "",
        });
      })
      .catch((error) => console.error("Error fetching workout:", error));
  }, []);

  const handleUpdate = (payload) => {
    api
      .patch(`/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`, payload)
      .then(() => {
        navigate(`/workout-plans/${planID}/workout-cycles/${cycleID}`);
      })
      .catch((error) => {
        console.error("Error updating workout:", error);
      });
  };

  if (!initialData) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <WorkoutForm
      initialData={initialData}
      onSubmit={handleUpdate}
      submitLabel="Update Workout"
    />
  );
};

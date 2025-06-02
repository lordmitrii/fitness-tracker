import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

const WorkoutPlanForm = ({ initialData = {}, onSubmit, submitLabel }) => {
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
      newErrors.name = "Workout plan name is required.";
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
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {submitLabel}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Workout Plan Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter plan name"
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

// Create workout plan page
export const CreateWorkoutPlanForm = () => {
  const navigate = useNavigate();

  const handleCreate = (payload) => {
    api
      .post("/workout-plans", payload)
      .then(() => {
        navigate("/workout-plans");
      })
      .catch((error) => {
        console.error("Error creating workout plan:", error);
      });
  };

  return (
    <WorkoutPlanForm
      onSubmit={handleCreate}
      submitLabel="Create Workout Plan"
    />
  );
};

// Update workout plan page
export const UpdateWorkoutPlanForm = () => {
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    api
      .get("/users/workout-plan")
      .then((response) => {
        const data = response.data;
        setInitialData({
          name: data.name || "",
        });
      })
      .catch((error) => console.error("Error fetching workout plan:", error));
  }, []);

  const handleUpdate = (payload) => {
    api
      .put("/workout-plans", payload)
      .then(() => {
        navigate("/workout-plans");
      })
      .catch((error) => {
        console.error("Error updating workout plan:", error);
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
    <WorkoutPlanForm
      initialData={initialData}
      onSubmit={handleUpdate}
      submitLabel="Update Workout Plan"
    />
  );
};

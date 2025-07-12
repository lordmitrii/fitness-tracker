import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";

// Add workout plan page
const AddWorkoutPlanForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [planName, setPlanName] = useState("");

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    setLoading(false);
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!planName.trim()) {
      newErrors.name = "Workout plan name is required.";
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    const payload = {
      name: planName.trim(),
    };

    handleCreate(payload);
  };

  const handleCreate = (payload) => {
    api
      .post("/workout-plans", { ...payload, active: true })
      .then(() => {
        navigate("/workout-plans");
      })
      .catch((error) => {
        console.error("Error creating workout plan:", error);
        setError(error);
      });
  };

  if (loading) return <LoadingState message="Loading workout plan..." />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="min-h-screen items-center bg-gray-50 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 flex flex-col gap-6">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-800">
          Add Workout Plan
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-lg font-medium text-gray-700 mb-1"
            >
              Plan Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter plan name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Add
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddWorkoutPlanForm;

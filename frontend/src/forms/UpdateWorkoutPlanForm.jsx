import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import { useTranslation } from "react-i18next";

// Update workout plan page
const UpdateWorkoutPlanForm = () => {
  const { planID } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [planName, setPlanName] = useState("");

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    setLoading(true);
    api
      .get(`/workout-plans/${planID}`)
      .then((response) => {
        setPlanName(response.data.name);
      })
      .catch((error) => {
        console.error("Error fetching workout plan:", error);
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!planName.trim()) {
      newErrors.name = t("update_workout_plan_form.plan_name_required");
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

    handleUpdate(payload);
  };

  const handleUpdate = (payload) => {
    api
      .patch(`/workout-plans/${planID}`, payload)
      .then(() => {
        navigate("/workout-plans");
      })
      .catch((error) => {
        console.error("Error updating workout plan:", error);
        setError(error);
      });
  };

  if (loading)
    return (
      <LoadingState
        message={t("update_workout_plan_form.loading_workout_plan")}
      />
    );
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="card flex flex-col gap-6">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-800">
        {t("update_workout_plan_form.update_workout_plan")}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-lg font-medium text-gray-700 mb-1"
          >
            {t("update_workout_plan_form.plan_name_label")}
          </label>
          <input
            type="text"
            name="name"
            id="name"
            placeholder={t("update_workout_plan_form.plan_name_placeholder")}
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {formErrors.name && (
            <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full">
          {t("general.update")}
        </button>
      </form>
    </div>
  );
};

export default UpdateWorkoutPlanForm;

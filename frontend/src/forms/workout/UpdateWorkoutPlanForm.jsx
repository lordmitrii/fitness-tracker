import { useState, useEffect, useCallback } from "react";
import api from "../../api";
import { useNavigate, useParams } from "react-router-dom";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
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

  const validate = useCallback(() => {
    const newErrors = {};
    if (!planName.trim()) {
      newErrors.name = t("update_workout_plan_form.plan_name_required");
    } else if (planName.length > 50) {
      newErrors.name = t("update_workout_plan_form.plan_name_too_long", {
        limit: 50,
      });
    }
    return newErrors;
  }, [planName, t]);

  const handleUpdate = useCallback(
    (payload) => {
      api
        .patch(`/workout-plans/${planID}`, payload)
        .then(() => {
          navigate("/workout-plans");
        })
        .catch((error) => {
          console.error("Error updating workout plan:", error);
          setError(error);
        });
    },
    [planID, navigate]
  );

  const handleSubmit = useCallback(
    (e) => {
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
    },
    [planName, t, handleUpdate, validate]
  );

  if (loading)
    return (
      <LoadingState
        message={t("update_workout_plan_form.loading_workout_plan")}
      />
    );
  if (error)
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );

  return (
    <div className="card flex flex-col gap-6">
      <h1 className="text-title font-bold mb-8 text-center">
        {t("update_workout_plan_form.update_workout_plan")}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="name" className="block text-body font-medium">
              {t("update_workout_plan_form.plan_name_label")}
            </label>
            <div className="text-caption">{planName.length}/50</div>
          </div>
          <input
            type="text"
            name="name"
            id="name"
            maxLength={50}
            placeholder={t("update_workout_plan_form.plan_name_placeholder")}
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="input-style"
          />
          {formErrors.name && (
            <p className="text-caption-red mt-1">{formErrors.name}</p>
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

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import { useTranslation } from "react-i18next";
import usePlansData from "../../hooks/data/usePlansData";
import useSinglePlanData from "../../hooks/data/useSinglePlanData";
import { usePullToRefreshOverride } from "../../context/PullToRefreshContext";

// Update workout plan page
const UpdateWorkoutPlanForm = () => {
  const { planID } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [planName, setPlanName] = useState("");

  const [formErrors, setFormErrors] = useState({});

  const {
    data: plan,
    isLoading: loading,
    error,
    refetch,
  } = useSinglePlanData(planID);
  const { mutations } = usePlansData({ skipQuery: true });

  usePullToRefreshOverride(
    useCallback(async () => {
      await refetch();
    }, [refetch])
  );

  useEffect(() => {
    if (plan?.name != null) setPlanName(plan.name);
  }, [plan?.name]);

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

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const validationErrors = validate();
      if (Object.keys(validationErrors).length) {
        setFormErrors(validationErrors);
        return;
      }
      await mutations.updatePlan.mutateAsync({
        planID,
        payload: { name: planName.trim() },
      });
      navigate("/workout-plans");
    },
    [validate, planID, planName, mutations.updatePlan, navigate]
  );

  if (loading)
    return (
      <LoadingState
        message={t("update_workout_plan_form.loading_workout_plan")}
      />
    );
  if (error)
    return (
      <ErrorState
        error={error}
        onRetry={() => mutations.updatePlan.refetch()}
      />
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

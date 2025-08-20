import { useState, useEffect, useCallback, useRef, memo } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { QK } from "../../hooks/data/useWorkoutData";

const WorkoutForm = memo(function WorkoutForm({
  initialData = {},
  onSubmit,
  label,
  submitLabel,
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !initialData || !Object.keys(initialData).length)
      return;
    setFormData((prev) => ({ ...prev, ...initialData }));
    loaded.current = true;
  }, [initialData]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t("workout_form.workout_name_required");
    } else if (formData.name.length > 50) {
      newErrors.name = t("workout_form.workout_name_too_long", {
        limit: 50,
      });
    }
    return newErrors;
  }, [formData, t]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        return;
      }

      const payload = {
        name: formData.name.trim(),
      };

      onSubmit(payload);
    },
    [formData, onSubmit, validate]
  );

  return (
    <div className="card flex flex-col gap-6">
      <h1 className="text-title font-bold mb-8 text-center">{label}</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="name" className="block text-body font-medium">
              {t("workout_form.workout_name_label")}
            </label>
            <div className="text-caption">{formData.name.length}/50</div>
          </div>
          <input
            type="text"
            name="name"
            id="name"
            placeholder={t("workout_form.workout_name_placeholder")}
            value={formData.name}
            onChange={handleChange}
            required
            maxLength={50}
            className="input-style"
          />
          {formErrors.name && (
            <p className="text-caption-red mt-1">{formErrors.name}</p>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full">
          {submitLabel}
        </button>
      </form>
    </div>
  );
});

// Create workout page
export const CreateWorkoutForm = () => {
  const { t } = useTranslation();
  const { planID, cycleID } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const qc = useQueryClient();

  const handleCreate = useCallback(
    async (payload) => {
      try {
        await api.post(
          `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts`,
          payload
        );
        await qc.invalidateQueries({ queryKey: QK.cycle(planID, cycleID) });
        navigate(`/workout-plans/${planID}/workout-cycles/${cycleID}`);
      } catch (error) {
        console.error("Error creating workout:", error);
        setError(error);
      }
    },
    [planID, cycleID, navigate]
  );

  if (error)
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );

  return (
    <WorkoutForm
      onSubmit={handleCreate}
      label={t("workout_form.create_workout")}
      submitLabel={t("general.create")}
    />
  );
};

// Update workout page
export const UpdateWorkoutForm = () => {
  const { planID, cycleID, workoutID } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const qc = useQueryClient();

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const res = await api.get(
          `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`
        );
        const data = res.data;
        setInitialData({
          name: data.name || "",
        });
      } catch (error) {
        console.error("Error fetching workout:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [planID, cycleID, workoutID]);

  const handleUpdate = useCallback(
    async (payload) => {
      try {
        await api.patch(
          `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`,
          payload
        );
        qc.invalidateQueries({ queryKey: QK.cycle(planID, cycleID) });
        navigate(`/workout-plans/${planID}/workout-cycles/${cycleID}`);
      } catch (error) {
        console.error("Error updating workout:", error);
        setError(error);
      }
    },
    [planID, cycleID, workoutID, navigate]
  );

  if (loading)
    return <LoadingState message={t("workout_form.loading_workout")} />;
  if (error)
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );

  return (
    <WorkoutForm
      key={workoutID}
      initialData={initialData}
      onSubmit={handleUpdate}
      label={t("workout_form.update_workout")}
      submitLabel={t("general.update")}
    />
  );
};

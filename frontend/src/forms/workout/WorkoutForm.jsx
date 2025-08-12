import { useState, useEffect } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import { useTranslation } from "react-i18next";

const WorkoutForm = ({ initialData = {}, onSubmit, label, submitLabel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    ...initialData,
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t("workout_form.workout_name_required");
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
      name: formData.name.trim(),
    };

    onSubmit(payload);
  };

  return (
    <div className="card flex flex-col gap-6">
      <h1 className="text-title font-bold mb-8 text-center">
        {label}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-body font-medium mb-1"
          >
            {t("workout_form.workout_name_label")}
          </label>
          <input
            type="text"
            name="name"
            id="name"
            placeholder={t("workout_form.workout_name_placeholder")}
            value={formData.name}
            onChange={handleChange}
            required
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
};

// Create workout page
export const CreateWorkoutForm = () => {
  const { t } = useTranslation();
  const { planID, cycleID } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleCreate = (payload) => {
    api
      .post(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts`,
        payload
      )
      .then(() => {
        navigate(`/workout-plans/${planID}/workout-cycles/${cycleID}`);
      })
      .catch((error) => {
        console.error("Error creating workout:", error);
        setError(error);
      });
  };

  if (loading) return <LoadingState />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
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

  useEffect(() => {
    setLoading(true);
    api
      .get(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`
      )
      .then((response) => {
        const data = response.data;
        setInitialData({
          name: data.name || "",
        });
      })
      .catch((error) => {
        console.error("Error fetching workout:", error);
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleUpdate = (payload) => {
    api
      .patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`,
        payload
      )
      .then(() => {
        navigate(`/workout-plans/${planID}/workout-cycles/${cycleID}`);
      })
      .catch((error) => {
        console.error("Error updating workout:", error);
        setError(error);
      });
  };

  if (loading)
    return <LoadingState message={t("workout_form.loading_workout")} />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <WorkoutForm
      initialData={initialData}
      onSubmit={handleUpdate}
      label={t("workout_form.update_workout")}
      submitLabel={t("general.update")}
    />
  );
};

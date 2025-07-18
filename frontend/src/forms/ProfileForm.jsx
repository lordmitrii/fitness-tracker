import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import { useTranslation } from "react-i18next";

const ProfileForm = ({ initialData = {}, onSubmit, label, submitLabel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    age: "",
    weight_kg: "",
    height_cm: "",
    sex: "",
    ...initialData,
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.age) newErrors.age = t("profile_form.age_required");
    else if (isNaN(parseInt(formData.age, 10)))
      newErrors.age = t("profile_form.age_must_be_number");
    if (!formData.weight_kg)
      newErrors.weight_kg = t("profile_form.weight_required");
    else if (isNaN(parseFloat(formData.weight_kg)))
      newErrors.weight_kg = t("profile_form.weight_must_be_number");
    if (!formData.height_cm)
      newErrors.height_cm = t("profile_form.height_required");
    else if (isNaN(parseFloat(formData.height_cm)))
      newErrors.height_cm = t("profile_form.height_must_be_number");
    if (!formData.sex) newErrors.sex = t("profile_form.sex_required");
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
      age: parseInt(formData.age, 10),
      weight_kg: parseFloat(formData.weight_kg),
      height_cm: parseFloat(formData.height_cm),
      sex: formData.sex,
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
            htmlFor="age"
            className="block text-body font-medium mb-1"
          >
            {t("profile_form.age_label")}
          </label>
          <input
            type="number"
            inputMode="numeric"
            name="age"
            id="age"
            placeholder={t("profile_form.age_placeholder")}
            value={formData.age}
            onChange={handleChange}
            className="input-style"
          />
          {formErrors.age && (
            <p className="text-caption-red mt-1">{formErrors.age}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="weight_kg"
            className="block text-body font-medium mb-1"
          >
            {t("profile_form.weight_label")} ({t("measurements.weight")})
          </label>
          <input
            type="number"
            inputMode="decimal"
            name="weight_kg"
            id="weight_kg"
            placeholder={
              t("profile_form.weight_placeholder") +
              " " +
              t("measurements.weight")
            }
            value={formData.weight_kg}
            onChange={handleChange}
            className="input-style"
          />
          {formErrors.weight_kg && (
            <p className="text-caption-red mt-1">{formErrors.weight_kg}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="height_cm"
            className="block text-body font-medium mb-1"
          >
            {t("profile_form.height_label")} ({t("measurements.height")})
          </label>
          <input
            type="number"
            inputMode="decimal"
            name="height_cm"
            id="height_cm"
            placeholder={
              t("profile_form.height_placeholder") +
              " " +
              t("measurements.height")
            }
            value={formData.height_cm}
            onChange={handleChange}
            className="input-style"
          />
          {formErrors.height_cm && (
            <p className="text-caption-red mt-1">{formErrors.height_cm}</p>
          )}
        </div>

        <div>
          <label className="block text-body font-medium mb-1">
            {t("profile_form.sex_label")}
          </label>
          <div className="flex items-center space-x-4">
            {[t("profile_form.sex_male"), t("profile_form.sex_female")].map(
              (s) => (
                <label key={s} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="sex"
                    value={s} 
                    checked={formData.sex === s}
                    onChange={handleChange}
                    className="accent-blue-600"
                  />
                  <span className="ml-2 text-body">{s}</span>
                </label>
              )
            )}
          </div>
          {formErrors.sex && (
            <p className="text-caption-red mt-1">{formErrors.sex}</p>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full">
          {submitLabel}
        </button>
      </form>
    </div>
  );
};

// Create profile page
export const CreateProfileForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleCreate = (payload) => {
    api
      .post("/users/profile", payload)
      .then(() => {
        navigate("/profile");
      })
      .catch((error) => {
        console.error("Error creating profile:", error);
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
    <ProfileForm
      onSubmit={handleCreate}
      label={t("profile_form.create_profile")}
      submitLabel={t("general.create")}
    />
  );
};

// Update profile page
export const UpdateProfileForm = () => {
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    api
      .get("/users/profile")
      .then((response) => {
        const data = response.data;
        setInitialData({
          age: data.age?.toString() || "",
          weight_kg: data.weight_kg?.toString() || "",
          height_cm: data.height_cm?.toString() || "",
          sex: data.sex || "",
        });
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleUpdate = (payload) => {
    api
      .put("/users/profile", payload)
      .then(() => {
        navigate("/profile");
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
        setError(error);
      });
  };

  if (loading)
    return <LoadingState message={t("profile_form.loading_profile")} />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <ProfileForm
      initialData={initialData}
      onSubmit={handleUpdate}
      label={t("profile_form.update_profile")}
      submitLabel={t("general.update")}
    />
  );
};

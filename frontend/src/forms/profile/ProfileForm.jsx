import { useState, useMemo, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import { useTranslation } from "react-i18next";
import useProfileData from "../../hooks/data/useProfileData";
import { PROFILE_LIMITS } from "../../config/constants";
import { toNumberOrEmpty } from "../../utils/numberUtils";

const NUMBER_FIELDS = new Set(["age", "weight_kg", "height_cm"]);

const ProfileForm = memo(function ProfileForm({
  initialData = {},
  onSubmit,
  label,
  submitLabel,
  submitting = false,
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    age: "",
    weight_kg: "",
    height_cm: "",
    sex: "",
  });
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !initialData || !Object.keys(initialData).length)
      return;
    setFormData((prev) => ({ ...prev, ...initialData }));
    loaded.current = true;
  }, [initialData]);

  const [formErrors, setFormErrors] = useState({});

  const validateField = useCallback(
    (name, value) => {
      switch (name) {
        case "age":
          if (value === "" || !Number.isInteger(value))
            return t("profile_form.age_must_be_number");
          if (value < PROFILE_LIMITS.age.min || value > PROFILE_LIMITS.age.max)
            return t("profile_form.age_out_of_range", {
              min: PROFILE_LIMITS.age.min,
              max: PROFILE_LIMITS.age.max,
            });
          return;
        case "weight_kg":
          if (value === "" || !Number.isFinite(value))
            return t("profile_form.weight_must_be_number");
          if (
            value < PROFILE_LIMITS.weight_kg.min ||
            value > PROFILE_LIMITS.weight_kg.max
          )
            return t("profile_form.weight_out_of_range", {
              min: PROFILE_LIMITS.weight_kg.min,
              max: PROFILE_LIMITS.weight_kg.max,
              unit: t("measurements.weight"),
            });
          return;
        case "height_cm":
          if (value === "" || !Number.isFinite(value))
            return t("profile_form.height_must_be_number");
          if (
            value < PROFILE_LIMITS.height_cm.min ||
            value > PROFILE_LIMITS.height_cm.max
          )
            return t("profile_form.height_out_of_range", {
              min: PROFILE_LIMITS.height_cm.min,
              max: PROFILE_LIMITS.height_cm.max,
              unit: t("measurements.height"),
            });
          return;
        case "sex":
          if (!["male", "female"].includes(value))
            return t("profile_form.sex_required");
          return;
      }
    },
    [t]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      const err = validateField(name, formData[name]);
      setFormErrors((prev) => ({ ...prev, [name]: err }));
    },
    [formData, validateField]
  );

  const validate = useCallback(() => {
    const fields = ["age", "weight_kg", "height_cm", "sex"];
    const errs = {};
    for (const name of fields) {
      const err = validateField(name, formData[name]);
      if (err) errs[name] = err;
    }
    return errs;
  }, [formData, validateField]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const nextValue = NUMBER_FIELDS.has(name) ? toNumberOrEmpty(value) : value;

    setFormData((prev) => ({ ...prev, [name]: nextValue }));

    setFormErrors((prev) =>
      prev[name] ? { ...prev, [name]: undefined } : prev
    );
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const validationErrors = validate();
      if (Object.keys(validationErrors).length) {
        setFormErrors(validationErrors);
        return;
      }

      const payload = {
        age: formData.age, // already a number
        weight_kg: Math.round(formData.weight_kg * 10) / 10,
        height_cm: Math.round(formData.height_cm * 10) / 10,
        sex: formData.sex,
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
          <label htmlFor="age" className="block text-body font-medium mb-1">
            {t("profile_form.age_label")}
          </label>
          <input
            type="number"
            inputMode="numeric"
            name="age"
            id="age"
            min={PROFILE_LIMITS.age.min}
            max={PROFILE_LIMITS.age.max}
            step="1"
            required
            placeholder={t("profile_form.age_placeholder")}
            value={formData.age}
            onChange={handleChange}
            onBlur={handleBlur}
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
            min={PROFILE_LIMITS.weight_kg.min}
            max={PROFILE_LIMITS.weight_kg.max}
            step="0.1"
            required
            placeholder={
              t("profile_form.weight_placeholder") +
              " " +
              t("measurements.weight")
            }
            value={formData.weight_kg}
            onChange={handleChange}
            onBlur={handleBlur}
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
            min={PROFILE_LIMITS.height_cm.min}
            max={PROFILE_LIMITS.height_cm.max}
            step="0.1"
            required
            placeholder={
              t("profile_form.height_placeholder") +
              " " +
              t("measurements.height")
            }
            value={formData.height_cm}
            onChange={handleChange}
            onBlur={handleBlur}
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
            {["male", "female"].map((key) => (
              <label key={key} className="inline-flex items-center">
                <input
                  type="radio"
                  name="sex"
                  value={key}
                  required
                  checked={formData.sex === key}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="accent-blue-600"
                />
                <span className="ml-2 text-body">
                  {t(`profile_form.sex_${key}`)}
                </span>
              </label>
            ))}
          </div>
          {formErrors.sex && (
            <p className="text-caption-red mt-1">{formErrors.sex}</p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={submitting}
        >
          {submitting ? t("general.saving") : submitLabel}
        </button>
      </form>
    </div>
  );
});

// Create profile page
export const CreateProfileForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { refetch, mutations } = useProfileData({ skipQuery: true });

  const handleCreate = (payload) => {
    mutations.create.mutate(payload, {
      onSuccess: () => navigate("/profile"),
      onError: (err) => {
        console.error("Error creating profile:", err);
      },
    });
  };

  if (mutations.create.error)
    return (
      <ErrorState
        error={mutations.create.error}
        onRetry={() => {
          mutations.create.reset();
          refetch();
          navigate("/profile");
        }}
      />
    );

  return (
    <ProfileForm
      onSubmit={handleCreate}
      label={t("profile_form.create_profile")}
      submitLabel={t("general.create")}
      submitting={mutations.create.isPending}
    />
  );
};

// Update profile page
export const UpdateProfileForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { profile, loading, error, refetch, mutations } = useProfileData();

  const initialData = useMemo(
    () => ({
      age: profile?.age ?? "",
      weight_kg: profile?.weight_kg ?? "",
      height_cm: profile?.height_cm ?? "",
      sex: profile?.sex || "",
    }),
    [profile]
  );

  const handleUpdate = (payload) => {
    mutations.upsert.mutate(payload, {
      onSuccess: () => {
        navigate("/profile");
      },
      onError: (err) => {
        console.error("Error updating profile:", err);
      },
    });
  };

  if (loading) return <LoadingState message={t("profile.loading_profile")} />;

  if (mutations.upsert.error || error) {
    return (
      <ErrorState
        error={mutations.upsert.error || error}
        onRetry={() => {
          mutations.upsert.reset();
          refetch();
          navigate("/profile");
        }}
      />
    );
  }

  return (
    <ProfileForm
      key={profile?.id ?? JSON.stringify(initialData)}
      initialData={initialData}
      onSubmit={handleUpdate}
      label={t("profile_form.update_profile")}
      submitLabel={t("general.update")}
      submitting={mutations.upsert.isPending}
    />
  );
};

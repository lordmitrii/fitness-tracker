import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import { useTranslation } from "react-i18next";
import useProfileData from "../../hooks/useProfileData";
import { PROFILE_LIMITS } from "../../config/constants";
import { toNumberOrEmpty } from "../../utils/numberUtils";

const ProfileForm = ({
  initialData = {},
  onSubmit,
  label,
  submitLabel,
  submitting = false,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    age: "",
    weight_kg: "",
    height_cm: "",
    sex: "",
    ...initialData,
  });

  const [formErrors, setFormErrors] = useState({});
  const NUMBER_FIELDS = new Set(["age", "weight_kg", "height_cm"]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = NUMBER_FIELDS.has(name) ? toNumberOrEmpty(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (formErrors[name])
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const errs = validate();
    if (errs[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: errs[name] }));
    } else if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};

    // age: integer
    const age = formData.age;
    if (age === "" || !Number.isInteger(age)) {
      errs.age = t("profile_form.age_must_be_number");
    } else if (age < PROFILE_LIMITS.age.min || age > PROFILE_LIMITS.age.max) {
      errs.age = t("profile_form.age_out_of_range", {
        min: PROFILE_LIMITS.age.min,
        max: PROFILE_LIMITS.age.max,
      });
    }

    // weight: float
    const w = formData.weight_kg;
    if (w === "" || !Number.isFinite(w)) {
      errs.weight_kg = t("profile_form.weight_must_be_number");
    } else if (
      w < PROFILE_LIMITS.weight_kg.min ||
      w > PROFILE_LIMITS.weight_kg.max
    ) {
      errs.weight_kg = t("profile_form.weight_out_of_range", {
        min: PROFILE_LIMITS.weight_kg.min,
        max: PROFILE_LIMITS.weight_kg.max,
        unit: t("measurements.weight"),
      });
    }

    // height: float
    const h = formData.height_cm;
    if (h === "" || !Number.isFinite(h)) {
      errs.height_cm = t("profile_form.height_must_be_number");
    } else if (
      h < PROFILE_LIMITS.height_cm.min ||
      h > PROFILE_LIMITS.height_cm.max
    ) {
      errs.height_cm = t("profile_form.height_out_of_range", {
        min: PROFILE_LIMITS.height_cm.min,
        max: PROFILE_LIMITS.height_cm.max,
        unit: t("measurements.height"),
      });
    }

    // sex: required
    if (!["male", "female"].includes(formData.sex)) {
      errs.sex = t("profile_form.sex_required");
    }

    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setFormErrors(validationErrors);
      return;
    }

    const payload = {
      age: formData.age, // already a number
      weight_kg: Number(formData.weight_kg.toFixed(1)),
      height_cm: Number(formData.height_cm.toFixed(1)),
      sex: formData.sex,
    };

    onSubmit(payload);
  };

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
            step="0.5"
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
};

// Create profile page
export const CreateProfileForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loading, error, refetch, mutations } = useProfileData();

  const handleCreate = (payload) => {
    mutations.create.mutate(payload, {
      onSuccess: () => navigate("/profile"),
      onError: (err) => {
        console.error("Error creating profile:", err);
      },
    });
  };

  if (error || mutations.create.error)
    return (
      <ErrorState
        error={error || mutations.create.error}
        onRetry={mutations.create.error ? mutations.create.reset : refetch}
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
  if (error || mutations.upsert.error)
    return (
      <ErrorState
        error={error || mutations.upsert.error}
        onRetry={mutations.upsert.error ? mutations.upsert.reset : refetch}
      />
    );

  return (
    <ProfileForm
      initialData={initialData}
      onSubmit={handleUpdate}
      label={t("profile_form.update_profile")}
      submitLabel={t("general.update")}
      submitting={mutations.upsert.isPending}
    />
  );
};

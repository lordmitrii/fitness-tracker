import { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import { useTranslation } from "react-i18next";
import useProfileData from "../../hooks/data/useProfileData";
import { PROFILE_LIMITS } from "../../config/constants";
import { toNumberOrEmpty } from "../../utils/numberUtils";
import { usePullToRefreshOverride } from "../../context/PullToRefreshContext";
import { useLocation } from "react-router-dom";
import {
  toDisplayHeight,
  toDisplayWeight,
  fromDisplayHeight,
  fromDisplayWeight,
  displayHeightMax,
  displayHeightMin,
  displayWeightMax,
  displayWeightMin,
} from "../../utils/numberUtils";

const NUMBER_FIELDS = new Set(["age", "weight", "height"]);

const ProfileForm = memo(function ProfileForm({
  initialData,
  onSubmit,
  label,
  submitLabel,
  submitting = false,
  unitSystem = "metric",
}) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState(
    initialData || {
      age: "",
      weight: "",
      height: "",
      sex: "",
    }
  );

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
        case "weight":
          if (value === "" || !Number.isFinite(value))
            return t("profile_form.weight_must_be_number");
          if (
            value < PROFILE_LIMITS.weight.min ||
            value > PROFILE_LIMITS.weight.max
          )
            return t("profile_form.weight_out_of_range", {
              min: displayWeightMin(PROFILE_LIMITS.weight.min, unitSystem),
              max: displayWeightMax(PROFILE_LIMITS.weight.max, unitSystem),
              unit: unitSystem === "metric" ? t("measurements.weight.kg") : t("measurements.weight.lbs_of"),
            });
          return;
        case "height":
          if (value === "" || !Number.isFinite(value))
            return t("profile_form.height_must_be_number");
          if (
            value < PROFILE_LIMITS.height.min ||
            value > PROFILE_LIMITS.height.max
          )
            return t("profile_form.height_out_of_range", {
              min: displayHeightMin(PROFILE_LIMITS.height.min, unitSystem),
              max: displayHeightMax(PROFILE_LIMITS.height.max, unitSystem),
              unit: unitSystem === "metric" ? t("measurements.height.cm") : t("measurements.height.ft_of"),
            });
          return;
        case "sex":
          if (!["male", "female"].includes(value))
            return t("profile_form.sex_required");
          return;
      }
    },
    [t, unitSystem]
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
    const fields = ["age", "weight", "height", "sex"];
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
        weight: formData.weight,
        height: formData.height,
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
            autoComplete="off"
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
          <label htmlFor="weight" className="block text-body font-medium mb-1">
            {t("profile_form.weight_label")} (
            {unitSystem === "metric"
              ? t("measurements.weight.kg")
              : t("measurements.weight.lbs_of")}
            )
          </label>
          <input
            type="number"
            inputMode="decimal"
            autoComplete="off"
            name="weight"
            id="weight"
            min={displayWeightMin(PROFILE_LIMITS.weight.min, unitSystem)}
            max={displayWeightMax(PROFILE_LIMITS.weight.max, unitSystem)}
            step="0.1"
            required
            placeholder={
              t("profile_form.weight_placeholder") +
              " " +
              t(
                unitSystem === "metric"
                  ? "measurements.weight.kg"
                  : "measurements.weight.lbs_of"
              )
            }
            value={toDisplayWeight(formData.weight, unitSystem)}
            onChange={(e) => {
              const raw = toNumberOrEmpty(e.target.value); 
              const displayVal = raw === "" ? "" : Math.round(raw * 10) / 10; 
              const baseVal = fromDisplayWeight(displayVal, unitSystem);
              setFormData((prev) => ({ ...prev, weight: baseVal }));
              setFormErrors((prev) =>
                prev.weight ? { ...prev, weight: undefined } : prev
              );
            }}
            onBlur={handleBlur}
            className="input-style"
          />
          {formErrors.weight && (
            <p className="text-caption-red mt-1">{formErrors.weight}</p>
          )}
        </div>

        <div>
          <label htmlFor="height" className="block text-body font-medium mb-1">
            {t("profile_form.height_label")} (
            {unitSystem === "metric"
              ? t("measurements.height.cm")
              : t("measurements.height.ft_of")}
            )
          </label>
          <input
            type="number"
            inputMode="decimal"
            autoComplete="off"
            name="height"
            id="height"
            min={displayHeightMin(PROFILE_LIMITS.height.min, unitSystem)}
            max={displayHeightMax(PROFILE_LIMITS.height.max, unitSystem)}
            step="0.1"
            required
            placeholder={
              t("profile_form.height_placeholder") +
              " " +
              t(
                unitSystem === "metric"
                  ? "measurements.height.cm"
                  : "measurements.height.ft_of"
              )
            }
            value={toDisplayHeight(formData.height, unitSystem)}
            onChange={
              (e) => {
                const raw = toNumberOrEmpty(e.target.value); 
                const displayVal = raw === "" ? "" : Math.round(raw * 10) / 10; 
                const baseVal = fromDisplayHeight(displayVal, unitSystem);
                setFormData((prev) => ({ ...prev, height: baseVal }));
                setFormErrors((prev) =>
                  prev.height ? { ...prev, height: undefined } : prev
                );
              }
            }
            onBlur={handleBlur}
            className="input-style"
          />
          {formErrors.height && (
            <p className="text-caption-red mt-1">{formErrors.height}</p>
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
  const location = useLocation();
  const { refetch, mutations } = useProfileData({ skipQuery: true });

  usePullToRefreshOverride(
    useCallback(async () => {
      await refetch();
    }, [refetch])
  );

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
      unitSystem={location.state?.unit_system}
    />
  );
};

// Update profile page
export const UpdateProfileForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();

  const { loading, error, refetch, mutations } = useProfileData({
    skipQuery: true,
  });

  usePullToRefreshOverride(
    useCallback(async () => {
      await refetch();
    }, [refetch])
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
      key={
        location.state?.profile?.id ?? JSON.stringify(location.state?.profile)
      }
      initialData={location.state?.profile}
      onSubmit={handleUpdate}
      label={t("profile_form.update_profile")}
      submitLabel={t("general.update")}
      submitting={mutations.upsert.isPending}
      unitSystem={location.state?.unit_system}
    />
  );
};

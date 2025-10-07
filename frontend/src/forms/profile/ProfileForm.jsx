import { useState, useCallback, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import { useTranslation } from "react-i18next";
import useProfileData from "../../hooks/data/useProfileData";
import { PROFILE_LIMITS } from "../../config/constants";
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
  INTEGER_INPUT_RE,
  DECIMAL_INPUT_RE,
  toNumOrNull,
} from "../../utils/numberUtils";

const ProfileForm = memo(function ProfileForm({
  initialData,
  onSubmit,
  label,
  submitLabel,
  submitting = false,
  unitSystem = "metric",
}) {
  const { t } = useTranslation();
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState(
    initialData || {
      age: "",
      weight: "",
      height: "",
      sex: "",
    }
  );

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
              unit:
                unitSystem === "metric"
                  ? t("measurements.weight.kg")
                  : t("measurements.weight.lbs_of"),
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
              unit:
                unitSystem === "metric"
                  ? t("measurements.height.cm")
                  : t("measurements.height.ft_of"),
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

  const [ageDraft, setAgeDraft] = useState(() =>
    (initialData?.age ?? "").toString()
  );
  const [weightDraft, setWeightDraft] = useState(() =>
    (toDisplayWeight(initialData?.weight, unitSystem) ?? "").toString()
  );
  const [heightDraft, setHeightDraft] = useState(() =>
    (toDisplayHeight(initialData?.height, unitSystem) ?? "").toString()
  );

  const [sexDraft, setSexDraft] = useState(() => initialData?.sex ?? "");

  useEffect(() => {
    setAgeDraft((formData.age ?? "").toString());
  }, [formData.age]);

  useEffect(() => {
    setWeightDraft(
      (toDisplayWeight(formData.weight, unitSystem) ?? "").toString()
    );
  }, [formData.weight, unitSystem]);

  useEffect(() => {
    setHeightDraft(
      (toDisplayHeight(formData.height, unitSystem) ?? "").toString()
    );
  }, [formData.height, unitSystem]);

  useEffect(() => {
    setSexDraft(formData.sex ?? "");
  }, [formData.sex]);

  const commitAge = useCallback(() => {
    const n = toNumOrNull(ageDraft);
    const intVal = n == null ? "" : Math.round(n);
    const err = validateField("age", intVal);
    setFormErrors((p) => ({ ...p, age: err }));

    if (!err) {
      setFormData((prev) => ({ ...prev, age: intVal }));
      setAgeDraft((intVal ?? "").toString());
    }
  }, [ageDraft, validateField]);

  const commitWeight = useCallback(() => {
    const n = toNumOrNull(weightDraft);
    const rounded = n == null ? "" : Math.round(n * 10) / 10;
    const base = rounded === "" ? "" : fromDisplayWeight(rounded, unitSystem);

    const clamped =
      base === ""
        ? ""
        : Math.max(
            PROFILE_LIMITS.weight.min,
            Math.min(base, PROFILE_LIMITS.weight.max)
          );

    const err = validateField("weight", clamped);
    setFormErrors((p) => ({ ...p, weight: err }));

    if (!err) {
      setFormData((prev) => ({ ...prev, weight: clamped }));
      setWeightDraft((toDisplayWeight(clamped, unitSystem) ?? "").toString());
    }
  }, [weightDraft, unitSystem, validateField]);

  const commitHeight = useCallback(() => {
    const n = toNumOrNull(heightDraft);
    const rounded = n == null ? "" : Math.round(n * 10) / 10;
    const base = rounded === "" ? "" : fromDisplayHeight(rounded, unitSystem);

    const clamped =
      base === ""
        ? ""
        : Math.max(
            PROFILE_LIMITS.height.min,
            Math.min(base, PROFILE_LIMITS.height.max)
          );

    const err = validateField("height", clamped);
    setFormErrors((p) => ({ ...p, height: err }));

    if (!err) {
      setFormData((prev) => ({ ...prev, height: clamped }));
      setHeightDraft((toDisplayHeight(clamped, unitSystem) ?? "").toString());
    }
  }, [heightDraft, unitSystem, validateField]);

  const commitSex = useCallback(() => {
    const err = validateField("sex", sexDraft);
    setFormErrors((p) => ({ ...p, sex: err }));

    if (!err) {
      setFormData((prev) => ({ ...prev, sex: sexDraft }));
    }
  }, [sexDraft, validateField]);

  const commitAllDrafts = useCallback(() => {
    commitAge();
    commitWeight();
    commitHeight();
    commitSex();
  }, [commitAge, commitWeight, commitHeight, commitSex]);

  const validate = useCallback(() => {
    const ageNum = toNumOrNull(ageDraft);
    const ageInt = ageNum == null ? "" : Math.round(ageNum);

    const wNum = toNumOrNull(weightDraft);
    const wRounded = wNum == null ? "" : Math.round(wNum * 10) / 10;
    const wBase =
      wRounded === "" ? "" : fromDisplayWeight(wRounded, unitSystem);

    const hNum = toNumOrNull(heightDraft);
    const hRounded = hNum == null ? "" : Math.round(hNum * 10) / 10;
    const hBase =
      hRounded === "" ? "" : fromDisplayHeight(hRounded, unitSystem);

    const candidate = {
      age: ageInt,
      weight: wBase,
      height: hBase,
      sex: sexDraft,
    };

    const fields = ["age", "weight", "height", "sex"];
    const errs = {};
    for (const name of fields) {
      const err = validateField(name, candidate[name]);
      if (err) errs[name] = err;
    }
    return { errs, candidate };
  }, [validateField, ageDraft, weightDraft, heightDraft, sexDraft, unitSystem]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      commitAllDrafts();

      const { errs, candidate } = validate();
      if (Object.keys(errs).length) {
        setFormErrors(errs);
        return;
      }

      onSubmit(candidate);
    },
    [commitAllDrafts, validate, onSubmit]
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
            type="text"
            inputMode="numeric"
            autoComplete="off"
            name="age"
            id="age"
            placeholder={t("profile_form.age_placeholder")}
            value={ageDraft}
            onChange={(e) => {
              const v = e.target.value;
              if (!INTEGER_INPUT_RE.test(v)) return;
              setAgeDraft(v);
              if (formErrors.age)
                setFormErrors((p) => ({ ...p, age: undefined }));
            }}
            onBlur={commitAge}
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
            type="text"
            inputMode="decimal"
            autoComplete="off"
            name="weight"
            id="weight"
            placeholder={
              t("profile_form.weight_placeholder") +
              " " +
              t(
                unitSystem === "metric"
                  ? "measurements.weight.kg"
                  : "measurements.weight.lbs_of"
              )
            }
            value={weightDraft}
            onChange={(e) => {
              const v = e.target.value;
              if (!DECIMAL_INPUT_RE.test(v)) return;
              setWeightDraft(v);
              if (formErrors.weight)
                setFormErrors((p) => ({ ...p, weight: undefined }));
            }}
            onBlur={commitWeight}
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
            type="text"
            inputMode="decimal"
            autoComplete="off"
            name="height"
            id="height"
            placeholder={
              t("profile_form.height_placeholder") +
              " " +
              t(
                unitSystem === "metric"
                  ? "measurements.height.cm"
                  : "measurements.height.ft_of"
              )
            }
            value={heightDraft}
            onChange={(e) => {
              const v = e.target.value;
              if (!DECIMAL_INPUT_RE.test(v)) return;
              setHeightDraft(v);
              if (formErrors.height)
                setFormErrors((p) => ({ ...p, height: undefined }));
            }}
            onBlur={commitHeight}
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
                  checked={sexDraft === key}
                  onChange={(e) => {
                    setSexDraft(e.target.value);
                    if (formErrors.sex)
                      setFormErrors((p) => ({ ...p, sex: undefined }));
                  }}
                  onBlur={commitSex}
                  required
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
      onSuccess: () => navigate("/profile", { replace: true }),
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
          navigate("/profile", { replace: true });
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

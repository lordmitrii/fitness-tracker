import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import useProfileData from "../../hooks/data/useProfileData";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import { usePullToRefreshOverride } from "../../context/PullToRefreshContext";
import useSettingsData from "../../hooks/data/useSettingsData";
import { toDisplayHeight, toDisplayWeight } from "../../utils/numberUtils";

const Health = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = useSettingsData();

  const { profile, loading, error, refetch } = useProfileData();

  const isEmpty = !profile || Object.keys(profile).length === 0;

  usePullToRefreshOverride(
    useCallback(async () => {
      await refetch();
    }, [refetch])
  );

  if (loading && isEmpty) {
    return <LoadingState message={t("profile.loading_profile")} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }
  return (
    <div className="card">
      <h1 className="text-title font-bold mb-8 text-center">
        {t("profile.your_profile")}
      </h1>

      {!!profile ? (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-body mb-8">
            <div className="font-semibold">{t("profile.age_label")}</div>
            <div className="text-right">{profile.age}</div>

            <div className="font-semibold">{t("profile.weight_label")}</div>
            <div className="text-right">
              {toDisplayWeight(profile.weight, settings?.unit_system)}{" "}
              {settings?.unit_system === "metric"
                ? t("measurements.weight.kg")
                : t("measurements.weight.lbs_of")}
            </div>

            <div className="font-semibold">{t("profile.height_label")}</div>
            <div className="text-right">
              {toDisplayHeight(profile.height, settings?.unit_system)}{" "}
              {settings?.unit_system === "metric"
                ? t("measurements.height.cm")
                : t("measurements.height.ft_of")}
            </div>

            <div className="font-semibold">{t("profile.sex_label")}</div>
            <div className="text-right capitalize">
              {t(`profile_form.sex_${profile.sex}`)}
            </div>
          </div>
          <button
            className="btn btn-primary w-full"
            onClick={() =>
              navigate("/profile/health/update-profile", { state: { profile, unit_system: settings?.unit_system } })
            }
          >
            {t("general.update")}
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-body text-center">
            {t("profile.no_profile_found")}
          </p>
          <button
            className="btn btn-primary w-full"
            onClick={() => navigate("/profile/health/create-profile", { state: { unit_system: settings?.unit_system } })}
          >
            {t("general.create_profile")}
          </button>
        </div>
      )}
    </div>
  );
};

export default Health;

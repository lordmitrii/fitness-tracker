import { useNavigate } from "react-router-dom";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import { useTranslation } from "react-i18next";
import { LayoutHeader } from "../layout/LayoutHeader";
import useProfileData from "../hooks/useProfileData";

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { profile, loading, error, isFetching, refetch } = useProfileData();

  const isEmpty = !profile || Object.keys(profile).length === 0;

  if (loading && isEmpty) {
    return <LoadingState message={t("profile.loading_profile")} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  return (
    <>
      <LayoutHeader>
        <h1 className="text-title font-bold px-4">{t("general.profile")}</h1>
        {isFetching && !isEmpty && (
          <div className="text-caption px-4">{t("general.refreshing")}…</div>
        )}
      </LayoutHeader>

      <div className="card">
        <h1 className="text-title font-bold mb-8 text-center">
          {t("profile.your_profile")}
        </h1>

        {profile && profile.age ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-body mb-8">
              <div className="font-semibold">{t("profile.age_label")}</div>
              <div className="text-right">{profile.age}</div>

              <div className="font-semibold">{t("profile.weight_label")}</div>
              <div className="text-right">
                {profile.weight_kg} {t("measurements.weight")}
              </div>

              <div className="font-semibold">{t("profile.height_label")}</div>
              <div className="text-right">
                {profile.height_cm} {t("measurements.height")}
              </div>

              <div className="font-semibold">{t("profile.sex_label")}</div>
              <div className="text-right capitalize">
                {t(`profile_form.sex_${profile.sex}`)}
              </div>
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={() => navigate("/update-profile")}
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
              onClick={() => navigate("/create-profile")}
            >
              {t("general.create_profile")}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;

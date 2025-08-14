import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import { useTranslation } from "react-i18next";

const Profile = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    api
      .get("/users/profile")
      .then((response) => {
        setProfile(response.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          setProfile({});
          return;
        }
        console.error("Error fetching profile:", error);
        setError(error)
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingState message={t("profile.loading_profile")} />;
  if (error)
    return (
      <ErrorState
        error={error}
        onRetry={() => window.location.reload()}
      />
    );

  return (
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
            <div className="text-right capitalize">{profile.sex}</div>
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
  );
};

export default Profile;

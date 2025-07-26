import { useEffect, useState } from "react";
import api from "../api";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import { useTranslation } from "react-i18next";
import MuscleGroupRadar from "../components/MuscleGroupRadar";

const ExerciseStats = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    api
      .get("/individual-exercises/stats")
      .then((response) => {
        setStats(response.data);
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading)
    return <LoadingState message={t("exercise_stats.loading_stats")} />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="card">
      <h1 className="text-title font-bold mb-8 text-center">
        {t("exercise_stats.your_stats")}
      </h1>
      <MuscleGroupRadar stats={stats} className="mb-4" />
      {stats && stats.length > 0 ? (
        <div className="flex flex-col gap-6">
          {stats
            .slice()
            .sort(
              (a, b) =>
                b.current_weight * b.current_reps -
                a.current_weight * a.current_reps
            )
            .map((exercise) => (
              <div
                key={exercise.id}
                className="sm:grid sm:grid-cols-2 rounded-xl shadow p-6 items-center justify-between gap-4 hover:shadow-lg transition border border-gray-200 shadow-md"
              >
                <div>
                  <div className="text-body-blue font-semibold">
                    {exercise.name}
                  </div>
                  <div className="text-caption capitalize mb-2">
                    {exercise.muscle_group && `${exercise.muscle_group.name}`}
                  </div>
                </div>
                <div>
                  <div className="text-caption font-semibold mb-1">
                    {t("exercise_stats.current_best")}
                  </div>
                  {exercise.current_reps && exercise.current_weight ? (
                    <div className="inline-block rounded-lg bg-blue-100 text-body-blue px-4 py-2 font-semibold">
                      {exercise.current_weight} {t("measurements.weight")} x{" "}
                      {exercise.current_reps} {t("measurements.reps")}
                    </div>
                  ) : (
                    <div className="text-caption italic">
                      {t("general.n_a")}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-body text-center py-8">
          {t("exercise_stats.no_stats")}
          <br />
          {t("exercise_stats.start_logging")}
        </div>
      )}
    </div>
  );
};

export default ExerciseStats;

import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import { useTranslation } from "react-i18next";
import MuscleGroupRadar from "../../components/MuscleGroupRadar";
import { e1RM } from "../../utils/exerciseStatsUtils";
import useStatsHook from "../../hooks/data/useStatsHook";
import { usePullToRefreshOverride } from "../../context/PullToRefreshContext";
import { useCallback } from "react";

const Stats = () => {
  const { t } = useTranslation();
  const { stats, bestPerformances, loading, error, refetch } = useStatsHook();

  usePullToRefreshOverride(
    useCallback(async () => {
      await refetch();
    }, [refetch])
  );

  if (loading)
    return <LoadingState message={t("exercise_stats.loading_stats")} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  return (
    <>
      <div className="card">
        <MuscleGroupRadar stats={stats} />
      </div>
      {stats && stats.length > 0 ? (
        <div className="card flex flex-col gap-6">
          <h2 className="text-title text-center">
            {t("exercise_stats.best_performances")}
          </h2>
          {bestPerformances.map((exercise) => (
            <div
              key={exercise.id}
              className="sm:grid sm:grid-cols-2 rounded-xl shadow p-6 items-center justify-between gap-4 hover:shadow-lg transition border border-gray-200 shadow-md"
            >
              <div className="mb-2">
                <div className="text-body-blue font-semibold">
                  {!!exercise.exercise?.slug
                    ? t(`exercise.${exercise.exercise.slug}`)
                    : exercise.name}
                </div>
                <div className="text-caption capitalize">
                  {!!exercise.muscle_group &&
                    t(`muscle_group.${exercise.muscle_group.slug}`)}
                </div>
                <div className="text-caption">
                  {exercise.is_bodyweight &&
                    "*" + t("exercise_stats.with_bodyweight")}
                </div>
              </div>
              <div>
                <div className="text-caption font-semibold mb-1">
                  {t("exercise_stats.current_best")}
                </div>
                {exercise.current_reps && exercise.current_weight ? (
                  <div className="relative inline-block">
                    <label
                      htmlFor={`toggle-e1rm-${exercise.id}`}
                      className="inline-block rounded-lg bg-blue-100 text-body-blue px-4 py-2 font-semibold cursor-pointer"
                      title="Click to toggle view"
                      tabIndex={0}
                    >
                      <input
                        type="checkbox"
                        id={`toggle-e1rm-${exercise.id}`}
                        className="peer hidden"
                      />
                      <span className="peer-checked:hidden">
                        {exercise.current_weight} {t("measurements.weight")} x{" "}
                        {exercise.current_reps}{" "}
                        {exercise.is_time_based
                          ? t("measurements.seconds")
                          : t("measurements.reps")}
                      </span>
                      <span className="hidden peer-checked:inline">
                        {!exercise.is_time_based ? (
                          <>
                            {Math.round(
                              e1RM(
                                exercise.current_weight,
                                exercise.current_reps
                              )
                            )}{" "}
                            {t("measurements.weight")} x 1{" "}
                            {t("measurements.reps")} (
                            {t("exercise_stats.estimated")})
                          </>
                        ) : (
                          <>
                            {t(
                              "exercise_stats.1rm_not_applicable_for_time_based"
                            )}{" "}
                          </>
                        )}
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="text-caption italic">{t("general.n_a")}</div>
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
    </>
  );
};

export default Stats;

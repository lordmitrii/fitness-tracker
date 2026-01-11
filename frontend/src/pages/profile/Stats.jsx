import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import { useTranslation } from "react-i18next";
import MuscleGroupRadar from "../../components/MuscleGroupRadar";
import { e1RM } from "../../utils/exerciseStatsUtils";
import useStatsHook from "../../hooks/data/useStatsHook";
import { usePullToRefreshOverride } from "../../context/PullToRefreshContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSettingsData from "../../hooks/data/useSettingsData";
import { toDisplayWeight } from "../../utils/numberUtils";
import SearchableSelect from "../../components/SearchableSelect";
import ExerciseTrendChart from "../../components/ExerciseTrendChart";

const Stats = () => {
  const { t } = useTranslation();
  const { stats, bestPerformances, loading, error, refetch } = useStatsHook();
  const { settings } = useSettingsData();
  const [activePane, setActivePane] = useState(0);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [openWhich, setOpenWhich] = useState("none");
  const sliderRef = useRef(null);

  const filteredStats = useMemo(() => {
    if (!stats || stats.length === 0) return [];
    return stats.filter((s) => s.current_reps && s.current_weight) || [];
  }, [stats]);

  const exercisesWithHistory = useMemo(
    () =>
      filteredStats.filter(
        (ex) => ex.recent_performances && ex.recent_performances.length > 0
      ),
    [filteredStats]
  );

  const selectedExercise = useMemo(() => {
    if (!exercisesWithHistory.length) return null;
    const match = exercisesWithHistory.find(
      (ex) => String(ex.id) === String(selectedExerciseId)
    );
    return match || exercisesWithHistory[0];
  }, [exercisesWithHistory, selectedExerciseId]);

  const exerciseOptions = useMemo(
    () =>
      exercisesWithHistory.map((ex) => {
        const label = !!ex.exercise?.slug
          ? t(`exercise.${ex.exercise.slug}`)
          : ex.name;
        return { ...ex, _label: label, _labelLower: label.toLowerCase() };
      }),
    [exercisesWithHistory, t]
  );

  const selectedExerciseLabel = useMemo(() => {
    if (!selectedExercise) return "";
    const opt = exerciseOptions.find((ex) => ex.id === selectedExercise.id);
    return opt?._label || "";
  }, [exerciseOptions, selectedExercise]);

  usePullToRefreshOverride(
    useCallback(async () => {
      await refetch();
    }, [refetch])
  );

  useEffect(() => {
    if (selectedExerciseId || !exercisesWithHistory.length) return;
    setSelectedExerciseId(exercisesWithHistory[0].id);
  }, [exercisesWithHistory, selectedExerciseId]);

  const exerciseTrend = useMemo(() => {
    if (!selectedExercise?.recent_performances?.length) return [];
    return selectedExercise.recent_performances
      .filter((p) => p.weight && p.reps)
      .map((p, idx) => {
        const weight = toDisplayWeight(p.weight, settings?.unit_system);
        const reps = p.reps;
        const completedAt = p.completed_at ? new Date(p.completed_at) : null;
        return {
          session: completedAt
            ? completedAt.toLocaleDateString()
            : t("exercise_stats.recent_session") + ` #${idx + 1}`,
          e1rm: Math.round(e1RM(weight, reps)),
          volume: Math.round(weight * reps),
        };
      });
  }, [selectedExercise?.recent_performances, settings?.unit_system, t]);

  const scrollToPane = useCallback((index) => {
    setActivePane(index);
    if (!sliderRef.current) return;
    sliderRef.current.scrollTo({
      left: index * sliderRef.current.clientWidth,
      behavior: "smooth",
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (!sliderRef.current) return;
    const { scrollLeft, clientWidth } = sliderRef.current;
    const next = Math.round(scrollLeft / clientWidth);
    if (next !== activePane) setActivePane(next);
  }, [activePane]);

  if (loading)
    return <LoadingState message={t("exercise_stats.loading_stats")} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  return (
    <>
      <div className="card overflow-hidden mb-6">
        <div className="flex justify-center gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition border ${
              activePane === 0
                ? "bg-blue-500 border-blue-500 text-white shadow"
                : "bg-white border-gray-200 text-gray-700"
            }`}
            onClick={() => scrollToPane(0)}
          >
            {t("exercise_stats.muscle_groups_strength")}
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition border ${
              activePane === 1
                ? "bg-blue-500 border-blue-500 text-white shadow"
                : "bg-white border-gray-200 text-gray-700"
            }`}
            onClick={() => scrollToPane(1)}
          >
            {t("exercise_stats.exercise_trend")}
          </button>
        </div>
        <div
          ref={sliderRef}
          onScroll={handleScroll}
          className="flex gap-0 sm:gap-4 overflow-x-auto pb-4 px-1 sm:px-0"
          style={{ scrollSnapType: "x mandatory" }}
        >
          <div className="min-w-full snap-center">
            <MuscleGroupRadar
              stats={filteredStats}
              unitSystem={settings?.unit_system}
              noCard
            />
          </div>
          <div className="min-w-full snap-center">
            <div className="flex flex-col gap-4 px-2 sm:px-4">
              <div className="flex items-center justify-between gap-3 flex-wrap sm:pt-1">
                <h2 className="text-title">
                  {t("exercise_stats.exercise_trend")}
                </h2>
                {exercisesWithHistory.length > 0 && (
                  <div className="w-full sm:w-64">
                    <SearchableSelect
                      items={exerciseOptions}
                      valueLabel={selectedExerciseLabel}
                      placeholder={t("exercise_stats.select_exercise")}
                      required
                      getKey={(ex) => ex.id}
                      getLabel={(ex) => ex._label}
                      getLabelLower={(ex) => ex._labelLower}
                      onSelect={(item) => {
                        if (!item) return;
                        setSelectedExerciseId(item.id);
                      }}
                      openKey="exerciseTrend"
                      openWhich={openWhich}
                      setOpenWhich={setOpenWhich}
                      t={t}
                      listId="exercise-trend-select"
                      maxCapPx={300}
                    />
                  </div>
                )}
              </div>
              {selectedExercise && exerciseTrend.length > 0 ? (
                <ExerciseTrendChart
                  data={exerciseTrend}
                  unitSystem={settings?.unit_system}
                  t={t}
                />
              ) : (
                <div className="text-body text-center text-gray-600 py-6">
                  {t("exercise_stats.no_trend_yet")}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-3 mt-2">
          {[0, 1].map((idx) => (
            <button
              key={idx}
              className={`h-2.5 w-2.5 rounded-full transition ${
                activePane === idx ? "bg-blue-500" : "bg-gray-300"
              }`}
              onClick={() => scrollToPane(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
      {filteredStats.length > 0 ? (
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
                      className="inline-block rounded-lg bg-gradient-to-r from-blue-200/90 to-blue-300/70 text-body-blue px-4 py-2 font-semibold cursor-pointer"
                      title="Click to toggle view"
                      tabIndex={0}
                    >
                      <input
                        type="checkbox"
                        id={`toggle-e1rm-${exercise.id}`}
                        className="peer hidden"
                      />
                      <span className="peer-checked:hidden">
                        {toDisplayWeight(
                          exercise.current_weight,
                          settings?.unit_system
                        )}{" "}
                        {settings?.unit_system === "metric"
                          ? t("measurements.weight.kg")
                          : t("measurements.weight.lbs_of")}{" "}
                        x {exercise.current_reps}{" "}
                        {exercise.is_time_based
                          ? t("measurements.seconds")
                          : t("measurements.reps")}
                      </span>
                      <span className="hidden peer-checked:inline">
                        {!exercise.is_time_based ? (
                          <>
                            {Math.round(
                              e1RM(
                                toDisplayWeight(
                                  exercise.current_weight,
                                  settings?.unit_system
                                ),
                                exercise.current_reps
                              )
                            )}{" "}
                            {settings?.unit_system === "metric"
                              ? t("measurements.weight.kg")
                              : t("measurements.weight.lbs_of")}{" "}
                            x 1 {t("measurements.reps")} (
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

import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import useExercisesData from "../../hooks/data/useExercisesData";
import { usePullToRefreshOverride } from "../../context/PullToRefreshContext";
import { highlightMatches } from "../../utils/highlightMatches";

const ExercisesAndMuscles = () => {
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");

  const {
    poolOnlyExercises: exercises,
    muscleGroups,
    error,
    isLoading: loading,
    refetch,
  } = useExercisesData();

  usePullToRefreshOverride(
    useCallback(async () => {
      await refetch();
    }, [refetch])
  );

  const matchesQuery = (ex, q) => {
    if (!q) return true;
    const ql = q.toLowerCase();

    return ex.name?.toLowerCase().includes(ql);
  };

  const filteredExercises = useMemo(() => {
    return exercises
      .filter((ex) => matchesQuery(ex, query.trim()))
      .filter((ex) => {
        if (muscleFilter === "all") return true;
        return ex.muscle_group_id === muscleFilter;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, query, muscleFilter, muscleGroups]);

  const exerciseCountByMuscle = useMemo(() => {
    const counts = new Map();
    muscleGroups.forEach((m) => counts.set(m.id, 0));
    exercises.forEach((ex) => {
      counts.set(ex.muscle_group_id, (counts.get(ex.muscle_group_id) || 0) + 1);
    });
    return counts;
  }, [exercises, muscleGroups]);

  if (loading) return <LoadingState />;

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-title">{t("admin.exercises.title")}</h1>

        <div className="flex items-center gap-2">
          <div className="flex w-full gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.exercises.search_placeholder")}
              className="input-style"
            />
            <button
              className={`btn ${
                !query && muscleFilter === "all"
                  ? "btn-secondary"
                  : "btn-primary"
              }`}
              onClick={() => {
                setQuery("");
                setMuscleFilter("all");
              }}
              disabled={!query && muscleFilter === "all"}
            >
              {t("general.clear")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="sm:col-span-2 overflow-x-auto rounded-xl shadow-sm border border-gray-600">
          <table className="min-w-full text-caption">
            <thead className="text-center text-body uppercase tracking-wide bg-gray-50">
              <tr>
                <th className="px-4 py-3">{t("admin.exercises.exercise")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredExercises.length === 0 ? (
                <tr>
                  <td
                    colSpan={1}
                    className="px-6 py-2 text-center text-caption"
                  >
                    {t("admin.no_exercises")}
                  </td>
                </tr>
              ) : (
                filteredExercises.map((ex) => {
                  return (
                    <tr
                      key={ex.id}
                      className="text-center border-t hover:bg-gray-50 transition-colors"
                    >
                      <td className="font-medium">
                        {highlightMatches(
                          ex.name,
                          query,
                          "bg-blue-600 text-white"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-gray-600 shadow-sm">
          <div className="p-3 border-b border-gray-600 bg-gray-50 rounded-t-xl">
            <h3 className="text-title">{t("admin.exercises.muscles_title")}</h3>
            <p className="text-caption">{t("admin.exercises.muscles_hint")}</p>
          </div>
          <ul className="divide-y">
            {muscleGroups
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((m, index) => {
                const count = exerciseCountByMuscle.get(m.id) || 0;
                const active =
                  muscleFilter !== "all" && Number(muscleFilter) === m.id;
                return (
                  <li
                    key={m.id}
                    className={`p-3 ${
                      muscleGroups.length - 1 === index
                        ? "rounded-b-xl border-b-0"
                        : ""
                    } flex items-center justify-between cursor-pointer border-b border-gray-600 hover:bg-gray-50 ${
                      active ? "bg-gray-300" : ""
                    }`}
                    onClick={() => setMuscleFilter(active ? "all" : m.id)}
                  >
                    <span className="text-body">{m.name}</span>
                    <span className="px-2 py-1 rounded-xl text-caption border border-gray-400 bg-gray-100">
                      {count}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExercisesAndMuscles;

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";

const ExercisesAndMuscles = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [exercises, setExercises] = useState([]);
  const [muscles, setMuscles] = useState([]);

  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");

  const reload = () => {
    setLoading(true);
    setError(null);
    Promise.all([api.get("/exercises"), api.get("/muscle-groups")])
      .then(([exRes, muRes]) => {
        setExercises(exRes.data || []);
        setMuscles(muRes.data || []);
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

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
  }, [exercises, query, muscleFilter, muscles]);

  const exerciseCountByMuscle = useMemo(() => {
    const counts = new Map();
    muscles.forEach((m) => counts.set(m.id, 0));
    exercises.forEach((ex) => {
      counts.set(ex.muscle_group_id, (counts.get(ex.muscle_group_id) || 0) + 1);
    });
    return counts;
  }, [exercises, muscles]);

  if (loading) return <LoadingState />;

  if (error) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-title">{t("admin.exercises.title")}</h1>

        <div className="flex items-center gap-2">
          <div className="flex w-100 gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.exercises.search_placeholder")}
              className="input-style"
            />

            <select
              className="w-30 input-style"
              value={muscleFilter}
              onChange={(e) =>
                setMuscleFilter(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
            >
              <option value="all">{t("admin.exercises.all_muscles")}</option>
              {muscles
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>
          <button
            className={`btn ${
              !query && muscleFilter === "all" ? "btn-secondary" : "btn-primary"
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="sm:col-span-2 overflow-x-auto rounded-xl shadow-sm border border-gray-600">
          <table className="min-w-full text-caption">
            <thead className="text-center text-body uppercase tracking-wide bg-gray-50">
              <tr>
                <th className="px-4 py-3">
                  {t("admin.exercises.table.exercise")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredExercises.length === 0 ? (
                <tr>
                  <td colSpan={1} className="p-6 text-center text-gray-500">
                    {t("admin.exercises.no_results")}
                  </td>
                </tr>
              ) : (
                filteredExercises.map((ex) => {
                  return (
                    <tr
                      key={ex.id}
                      className="text-center border-t hover:bg-gray-50 transition-colors"
                    >
                      <td className="font-medium">{ex.name}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border shadow-sm">
          <div className="p-3 border-b bg-gray-50 rounded-t-xl">
            <h3 className="font-medium">
              {t("admin.exercises.muscles_title")}
            </h3>
            <p className="text-xs text-gray-500">
              {t("admin.exercises.muscles_hint")}
            </p>
          </div>
          <ul className="divide-y">
            {muscles
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
                      muscles.length - 1 === index ? "rounded-b-xl" : ""
                    } flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                      active ? "bg-gray-100" : ""
                    }`}
                    onClick={() => setMuscleFilter(active ? "all" : m.id)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{m.name}</span>
                      {m.group ? (
                        <span className="text-xs text-gray-500">{m.group}</span>
                      ) : null}
                    </div>
                    <span className="text-caption px-2 py-1 rounded-xl bg-gray-100">
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

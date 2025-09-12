import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import useExercisesData from "../../hooks/data/useExercisesData";
import { usePullToRefreshOverride } from "../../context/PullToRefreshContext";
import { highlightMatches } from "../../utils/highlightMatches";
import AddExerciseOrMuscleModal from "../../modals/admin/AddExerciseOrMuscleModal";
import DeleteIcon from "../../icons/DeleteIcon";
import EditIcon from "../../icons/EditIcon";
import CheckIcon from "../../icons/CheckIcon";

const ExercisesAndMuscles = () => {
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [exEditModeEnabled, setExEditModeEnabled] = useState(false);
  const [mgEditModeEnabled, setMgEditModeEnabled] = useState(false);

  const {
    poolOnlyExercises: exercises,
    muscleGroups,
    error,
    isLoading: loading,
    refetch,
    mutations,
  } = useExercisesData();

  usePullToRefreshOverride(
    useCallback(async () => {
      await refetch();
    }, [refetch])
  );

  const exercisesL10n = useMemo(() => {
    return (exercises ?? []).map((ex) => {
      let base = "";
      if (ex.slug) {
        const translated = t(`exercise.${ex.slug}`);
        if (translated && translated !== `exercise.${ex.slug}`)
          base = translated;
      }
      if (!base) base = ex.name || t("general.n_a");
      return {
        ...ex,
        _label: base,
        _labelLower: base.toLowerCase(),
        // _nameLower: (ex.name || "").toLowerCase(),
      };
    });
  }, [exercises, t]);

  const muscleGroupsL10n = useMemo(() => {
    return (muscleGroups ?? []).map((g) => {
      let label = "";
      if (g.slug) {
        const translated = t(`muscle_group.${g.slug}`);
        if (translated && translated !== `muscle_group.${g.slug}`)
          label = translated;
      }
      if (!label) label = g.name || t("general.n_a");
      return { ...g, _label: label, _labelLower: label.toLowerCase() };
    });
  }, [muscleGroups, t]);

  const matchesQuery = (ex, q) => {
    if (!q) return true;
    const ql = q.toLowerCase();
    return ex._labelLower.includes(ql);
  };

  const filteredExercises = useMemo(() => {
    const q = query.trim();
    return exercisesL10n
      .filter((ex) => matchesQuery(ex, q))
      .filter((ex) =>
        muscleFilter === "all" ? true : ex.muscle_group_id === muscleFilter
      )
      .sort((a, b) => a._label.localeCompare(b._label));
  }, [exercisesL10n, query, muscleFilter]);

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
            <button
              className="btn btn-primary whitespace-nowrap"
              onClick={() => setIsModalOpen(true)}
            >
              {t("admin.exercises.add_exercise")}
            </button>
            <input
              type="text"
              autoComplete="off"
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
                <th className="px-4 py-3 flex items-center justify-center gap-2">
                  {t("admin.exercises.exercise")}{" "}
                  <button
                    className=""
                    onClick={() => setExEditModeEnabled(!exEditModeEnabled)}
                  >
                    {exEditModeEnabled ? (
                      <CheckIcon className={"size-4"} />
                    ) : (
                      <EditIcon className={"size-4"} />
                    )}
                  </button>
                </th>
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
                      <td
                        className={`font-medium flex items-center text-start ${
                          exEditModeEnabled
                            ? "justify-between"
                            : "justify-center"
                        } gap-2 px-4 py-2`}
                      >
                        {highlightMatches(
                          ex._label,
                          query,
                          "bg-blue-600 text-white"
                        )}
                        {exEditModeEnabled && (
                          <div className="flex gap-2 justify-center">
                            {/* <button
                            className="btn btn-primary"
                            onClick={() => {
                            }}
                          >
                            <EditIcon className={"size-4"} strokeWidth={2} />
                          </button> */}
                            <button
                              className="btn btn-danger"
                              onClick={() => {
                                if (
                                  confirm(
                                    t("admin.exercises.confirm_delete_exercise")
                                  )
                                ) {
                                  mutations.deleteExercise.mutate(ex.id);
                                }
                              }}
                            >
                              <DeleteIcon
                                className={"size-4"}
                                strokeWidth={2}
                              />
                            </button>
                          </div>
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
            <h3 className="text-title">
              <div className="flex items-center gap-2">
                {t("admin.exercises.muscles_title")}{" "}
                <button className="" onClick={() => setMgEditModeEnabled(!mgEditModeEnabled)}>
                  {mgEditModeEnabled ? (
                    <CheckIcon className={"size-4"} />
                  ) : (
                    <EditIcon className={"size-4"} />
                  )}
                </button>
              </div>
            </h3>
            <p className="text-caption">{t("admin.exercises.muscles_hint")}</p>
          </div>
          <ul className="divide-y">
            {muscleGroupsL10n
              .slice()
              .sort((a, b) => a._label.localeCompare(b._label))
              .map((m, index) => {
                const count = exerciseCountByMuscle.get(m.id) || 0;
                const active =
                  muscleFilter !== "all" && Number(muscleFilter) === m.id;
                return (
                  <li
                    key={m.id}
                    className={`p-3 ${
                      muscleGroupsL10n.length - 1 === index
                        ? "rounded-b-xl border-b-0"
                        : ""
                    } flex items-center justify-between cursor-pointer border-b border-gray-600 hover:bg-gray-50 ${
                      active ? "bg-gray-300" : ""
                    }`}
                    onClick={() => setMuscleFilter(active ? "all" : m.id)}
                  >
                    <span className="text-body">{m._label}</span>
                    {mgEditModeEnabled ? (
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          if (
                            confirm(
                              t("admin.exercises.confirm_delete_muscle_group")
                            )
                          ) {
                            mutations.deleteMuscleGroup.mutate(m.id);
                            if (muscleFilter === Number(m.id))
                              setMuscleFilter("all");
                          }
                        }}
                      >
                        <DeleteIcon className={"size-4"} strokeWidth={2} />
                      </button>
                    ) : (
                      <span className="px-2 py-1 rounded-xl text-caption border border-gray-400 bg-gray-100">
                        {count}
                      </span>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      {!!actionError && <p className="mt-2 text-caption-red">{actionError}</p>}

      {isModalOpen && (
        <AddExerciseOrMuscleModal
          exercisesL10n={exercisesL10n}
          muscleGroupsL10n={muscleGroupsL10n}
          loading={loading}
          onCreateExercise={({ name, muscle_group_id }) =>
            mutations.createExercise.mutate({ name, muscle_group_id })
          }
          onCreateMuscleGroup={({ name }) =>
            mutations.createMuscleGroup.mutate({ name })
          }
          onError={(err) =>
            setActionError(
              err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message
            )
          }
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ExercisesAndMuscles;

import { getExerciseProgressBadge } from "../utils/exerciseUtils";
import DropdownMenu from "./DropdownMenu";
import api from "../api";
import WorkoutExerciseDetailsMenu from "./WorkoutExerciseDetailsMenu";
import WorkoutSetDetailsMenu from "./WorkoutSetDetailsMenu";
import { useTranslation } from "react-i18next";
import CheckIcon from "../icons/CheckIcon";

const WorkoutExerciseTable = ({
  planID,
  cycleID,
  workoutID,
  workoutName,
  exercises,
  isCurrentCycle,
  onUpdateExercises,
  onError,
}) => {
  const { t } = useTranslation();

  const handleToggleExercise = async (exId, setId, reps, weight, checked) => {
    onUpdateExercises((prev) =>
      prev.map((item) => {
        if (item.id !== exId) return item;

        const newSets = item.workout_sets.map((s) =>
          s.id === setId ? { ...s, completed: checked, reps, weight } : s
        );

        const exerciseCompleted = newSets.every((s) => s.completed);

        return {
          ...item,
          workout_sets: newSets,
          completed: exerciseCompleted,
        };
      })
    );

    try {
      await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exId}/workout-sets/${setId}/update-complete`,
        { completed: checked }
      );

      // If the set is not completed, we don't need to update sets, reps, and weight
      if (!checked) return;

      await api.patch(
        `/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}/workout-exercises/${exId}/workout-sets/${setId}`,
        { reps, weight }
      );
    } catch (error) {
      console.error("Error toggling exercise completion:", error);
      onError(error);
    }
  };

  const checkInputFields = (set) => {
    if (
      typeof set.reps !== "number" ||
      typeof set.weight !== "number" ||
      isNaN(set.reps) ||
      isNaN(set.weight)
    ) {
      return false;
    }
    if (set.reps <= 0 || set.weight < 0) {
      return false;
    }
    if (!Number.isInteger(set.reps)) {
      return false;
    }
    return true;
  };

  return (
    <div className="flex flex-col gap-6 sm:p-4 rounded-lg shadow-md">
      {exercises
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((ex) => (
          <div
            key={ex.id}
            className="sm:rounded-2xl shadow-md bg-white sm:p-4 flex flex-col gap-4 sm:border sm:border-gray-100"
          >
            {/* Exercise header */}
            <div className="flex flex-row items-start sm:items-center justify-between gap-1">
              <div className="font-medium text-body-blue">
                {ex.index}. {ex.individual_exercise.name}
                <span className="ml-2 text-caption font-bold">
                  {ex.individual_exercise.muscle_group &&
                    `(${ex.individual_exercise.muscle_group.name})`}
                </span>
              </div>
              <DropdownMenu
                dotsHorizontal={true}
                dotsHidden={!isCurrentCycle}
                menu={({ close }) => (
                  <WorkoutExerciseDetailsMenu
                    planID={planID}
                    cycleID={cycleID}
                    workoutID={workoutID}
                    workoutName={workoutName}
                    exercise={ex}
                    exercises={exercises}
                    updateExercises={onUpdateExercises}
                    closeMenu={close}
                    onError={onError}
                  />
                )}
              />
            </div>

            {/* Sets table */}
            <div className="overflow-x-auto">
              <div className="min-w-full grid grid-cols-[7dvw_1fr_1fr_7dvw_1fr] sm:grid-cols-[36px_1fr_1fr_1fr_1fr_1fr] gap-4 text-gray-600 font-semibold border-b pb-2 sm:text-normal text-sm">
                <div className=""></div>
                <div className="hidden sm:block">
                  {t("workout_plan_single.set_label")}
                </div>
                <div className="hidden sm:block">
                  {t("workout_plan_single.weight_label")} (
                  {t("measurements.weight")})
                </div>
                <div className="sm:hidden">
                  {t("workout_plan_single.weight_label_short")} (
                  {t("measurements.weight")})
                </div>
                <div className="">{t("workout_plan_single.reps_label")}</div>
                <div className="invisible sm:visible text-center">
                  {t("workout_plan_single.badge_label")}
                </div>
                <div className="text-center">
                  {t("workout_plan_single.done_label")}
                </div>
              </div>
              <div className="flex flex-col divide-y">
                {(ex.workout_sets || [])
                  .slice()
                  .sort((a, b) => a.index - b.index)
                  .map((set) => (
                    <div
                      key={set.id}
                      className="min-w-full grid grid-cols-[7dvw_1fr_1fr_7dvw_1fr] sm:grid-cols-[36px_1fr_1fr_1fr_1fr_1fr] gap-4 items-center py-2"
                    >
                      <DropdownMenu
                        dotsHidden={!isCurrentCycle}
                        isLeft={true}
                        menu={({ close }) => (
                          <WorkoutSetDetailsMenu
                            planID={planID}
                            cycleID={cycleID}
                            workoutID={workoutID}
                            set={set}
                            exercise={ex}
                            updateExercises={onUpdateExercises}
                            closeMenu={close}
                            onError={onError}
                          />
                        )}
                      />
                      <div className="hidden sm:block font-bold text-gray-600">
                        {set.index}
                      </div>
                      <input
                        type="number"
                        placeholder={set.previous_weight}
                        value={set.weight || ""}
                        min={0}
                        inputMode="decimal"
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          onUpdateExercises((prev) =>
                            prev.map((item) =>
                              item.id === ex.id
                                ? {
                                    ...item,
                                    workout_sets: item.workout_sets.map((s) =>
                                      s.index === set.index
                                        ? {
                                            ...s,
                                            weight: value,
                                            completed: false,
                                          }
                                        : s
                                    ),
                                  }
                                : item
                            )
                          );
                        }}
                        className={`input-style placeholder:italic ${
                          set.completed || !isCurrentCycle
                            ? "opacity-40 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={!isCurrentCycle}
                      />
                      <input
                        type="number"
                        placeholder={set.previous_reps}
                        value={set.reps || ""}
                        min={1}
                        inputMode="numeric"
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          onUpdateExercises((prev) =>
                            prev.map((item) =>
                              item.id === ex.id
                                ? {
                                    ...item,
                                    workout_sets: item.workout_sets.map((s) =>
                                      s.index === set.index
                                        ? {
                                            ...s,
                                            reps: value,
                                            completed: false,
                                          }
                                        : s
                                    ),
                                  }
                                : item
                            )
                          );
                        }}
                        className={`input-style placeholder:italic ${
                          set.completed || !isCurrentCycle
                            ? "opacity-40 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={!isCurrentCycle}
                      />
                      <span className="text-gray-600 w-5 justify-self-center">
                        {getExerciseProgressBadge(set)}
                      </span>
                      <label className="relative flex justify-center items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!set.completed}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (checked && !checkInputFields(set)) {
                              alert(
                                t("workout_plan_single.please_check_fields")
                              );
                              return;
                            }
                            handleToggleExercise(
                              ex.id,
                              set.id,
                              set.reps,
                              set.weight,
                              checked
                            );
                          }}
                          className="sr-only peer"
                          title={t("workout_plan_single.set_completed")}
                          disabled={!isCurrentCycle}
                        />
                        <div
                          className={`size-6 bg-white dark:bg-gray-500 border border-gray-300 rounded transition duration-150 ease-in-out
                                      peer-checked:bg-blue-600 peer-checked:border-transparent
                                      peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400
                                      flex items-center justify-center
                                    `}
                        />

                        <CheckIcon
                          className={`absolute size-6 text-white hidden peer-checked:block`}
                        />
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default WorkoutExerciseTable;

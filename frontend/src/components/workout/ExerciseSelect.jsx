import { useMemo, memo, useCallback } from "react";
import SearchableSelect from "../SearchableSelect";

const ExerciseSelect = ({
  t,
  exercises,
  muscleGroupID,
  value,
  onChange,
  error,
  openWhich,
  setOpenWhich,
}) => {
  const byGroup = useMemo(
    () =>
      muscleGroupID != null
        ? exercises.filter((ex) => ex.muscle_group_id === muscleGroupID)
        : exercises,
    [exercises, muscleGroupID]
  );

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    const ex = exercises.find(
      (e) => e.source === value.source && e.id === value.id
    );
    return ex ? ex._label : "";
  }, [value, exercises]);

  const getKey = useCallback((ex) => `${ex.source}-${ex.id}`, []);
  const getLabel = useCallback((ex) => ex._label, []);
  const getLabelLower = useCallback((ex) => ex._labelLower, []);
  const filterPredicate = useCallback(
    (ex, qLower) =>
      ex._labelLower.includes(qLower), // || ex._nameLower.includes(qLower),
    []
  );
  const handleSelect = useCallback(
    (item) => onChange(item ? { source: item.source, id: item.id } : null),
    [onChange]
  );

  return (
    <>
      <SearchableSelect
        items={byGroup}
        valueLabel={selectedLabel}
        placeholder={`${t("add_workout_exercise_modal.select_exercise")}…`}
        required={false}
        getKey={getKey}
        getLabel={getLabel}
        getLabelLower={getLabelLower}
        filterPredicate={filterPredicate}
        onSelect={handleSelect}
        openKey="exercise"
        openWhich={openWhich}
        setOpenWhich={setOpenWhich}
        t={t}
        showClearRow={false}
        listId="exercise-list"
      />
      {error && <p className="text-caption-red mt-1">{error}</p>}
    </>
  );
};

export default memo(ExerciseSelect);

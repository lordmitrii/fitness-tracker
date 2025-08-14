import { useMemo, memo, useCallback } from "react";
import SearchableSelect from "../SearchableSelect";

const MuscleGroupSelect = ({
  t,
  muscleGroups,
  value,
  onChange,
  required,
  openWhich,
  setOpenWhich,
}) => {
  const selectedLabel = useMemo(() => {
    const g = value == null ? null : muscleGroups.find((x) => x.id === value);
    return g ? g._label : "";
  }, [muscleGroups, value]);

  const getKey = useCallback((g) => String(g.id), []);
  const getLabel = useCallback((g) => g._label, []);
  const getLabelLower = useCallback((g) => g._labelLower, []);
  const handleSelect = useCallback(
    (item) => onChange(item ? item.id : null),
    [onChange]
  );

  return (
    <SearchableSelect
      items={muscleGroups}
      valueLabel={selectedLabel}
      placeholder={
        required
          ? t("add_workout_exercise_modal.select_muscle_group")
          : t("add_workout_exercise_modal.all_muscle_groups")
      }
      required={required}
      getKey={getKey}
      getLabel={getLabel}
      getLabelLower={getLabelLower}
      onSelect={handleSelect}
      openKey="muscle"
      openWhich={openWhich}
      setOpenWhich={setOpenWhich}
      t={t}
      showClearRow={!required}
      clearRowLabel={t("add_workout_exercise_modal.all_muscle_groups")}
      listId="muscle-list"
    />
  );
};

export default memo(MuscleGroupSelect);

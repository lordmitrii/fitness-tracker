import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface MuscleGroup {
  id: string | number;
  name?: string;
  slug?: string;
}

export function useLocalizeMuscles(muscleGroups: MuscleGroup[]) {
  const { t } = useTranslation();

  const localizedMuscles = useMemo(() => {
    return muscleGroups.map((group) => {
      let label = group.name || t("general.n_a");
      if (group.slug) {
        const translated = t(`muscle_group.${group.slug}`);
        if (translated && translated !== `muscle_group.${group.slug}`) {
          label = translated;
        }
      }
      return {
        ...group,
        _label: label,
        _labelLower: label.toLowerCase(),
      };
    });
  }, [muscleGroups, t]);

  return { localizedMuscles };
}


import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface Exercise {
  id: string | number;
  name?: string;
  slug?: string;
}

export function useLocalizeExercises(exercises: Exercise[]) {
  const { t } = useTranslation();

  const localizedExercises = useMemo(() => {
    return exercises.map((exercise) => {
      let label = exercise.name || t("general.n_a");
      if (exercise.slug) {
        const translated = t(`exercise.${exercise.slug}`);
        if (translated && translated !== `exercise.${exercise.slug}`) {
          label = translated;
        }
      }
      return {
        ...exercise,
        _label: label,
        _labelLower: label.toLowerCase(),
      };
    });
  }, [exercises, t]);

  return { localizedExercises };
}


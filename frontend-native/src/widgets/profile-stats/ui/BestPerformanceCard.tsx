import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { toDisplayWeight, e1RM } from "@/src/shared/utils/formatting";

interface BestPerformanceCardProps {
  exercise: {
    id: string | number;
    name?: string;
    exercise?: { slug?: string };
    muscle_group?: { slug?: string };
    current_reps?: number;
    current_weight?: number;
    is_bodyweight?: boolean;
    is_time_based?: boolean;
  };
  unitSystem?: "metric" | "imperial";
  showE1RM: boolean;
  onToggleE1RM: () => void;
}

export default function BestPerformanceCard({
  exercise,
  unitSystem = "metric",
  showE1RM,
  onToggleE1RM,
}: BestPerformanceCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const exerciseRef = exercise.exercise as { slug?: string } | undefined;
  const muscleGroup = exercise.muscle_group as { slug?: string } | undefined;
  const exerciseName = (exercise.name as string | undefined) || t("general.n_a");

  return (
    <View
      style={[
        styles.exerciseCard,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.exerciseInfo}>
        <Text style={[styles.exerciseName, { color: theme.colors.text.primary }]}>
          {exerciseRef?.slug
            ? t(`exercise.${exerciseRef.slug}`)
            : exerciseName}
        </Text>
        {muscleGroup?.slug && (
          <Text style={[styles.muscleGroup, { color: theme.colors.text.secondary }]}>
            {t(`muscle_group.${muscleGroup.slug}`)}
          </Text>
        )}
        {(exercise.is_bodyweight as boolean | undefined) && (
          <Text style={[styles.bodyweightNote, { color: theme.colors.text.tertiary }]}>
            *{t("exercise_stats.with_bodyweight")}
          </Text>
        )}
      </View>
      <View style={styles.performanceContainer}>
        <Text style={[styles.performanceLabel, { color: theme.colors.text.secondary }]}>
          {t("exercise_stats.current_best")}
        </Text>
        {exercise.current_reps && exercise.current_weight ? (
          <Pressable
            onPress={onToggleE1RM}
            style={[
              styles.performanceValue,
              {
                backgroundColor: theme.colors.button.primary.background,
              },
            ]}
          >
            <Text style={[styles.performanceText, { color: theme.colors.button.primary.text }]}>
              {!showE1RM ? (
                <>
                  {toDisplayWeight(exercise.current_weight, unitSystem)}{" "}
                  {unitSystem === "metric"
                    ? t("measurements.weight.kg")
                    : t("measurements.weight.lbs_of")}{" "}
                  x {exercise.current_reps}{" "}
                  {exercise.is_time_based
                    ? t("measurements.seconds")
                    : t("measurements.reps")}
                </>
              ) : !exercise.is_time_based ? (
                <>
                  {Math.round(
                    e1RM(
                      toDisplayWeight(exercise.current_weight, unitSystem),
                      exercise.current_reps
                    )
                  )}{" "}
                  {unitSystem === "metric"
                    ? t("measurements.weight.kg")
                    : t("measurements.weight.lbs_of")}{" "}
                  x 1 {t("measurements.reps")} ({t("exercise_stats.estimated")})
                </>
              ) : (
                t("exercise_stats.1rm_not_applicable_for_time_based")
              )}
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.naText, { color: theme.colors.text.tertiary }]}>
            {t("general.n_a")}
          </Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  exerciseCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    borderWidth: 1,
    marginBottom: theme.spacing[3],
    gap: theme.spacing[3],
  },
  exerciseInfo: {
    gap: theme.spacing[1],
  },
  exerciseName: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
  muscleGroup: {
    fontSize: theme.fontSize.sm,
    textTransform: "capitalize",
  },
  bodyweightNote: {
    fontSize: theme.fontSize.sm,
    fontStyle: "italic",
  },
  performanceContainer: {
    gap: theme.spacing[2],
  },
  performanceLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
  },
  performanceValue: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
    alignItems: "center",
  },
  performanceText: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    textAlign: "center",
  },
  naText: {
    fontSize: theme.fontSize.sm,
    fontStyle: "italic",
  },
});


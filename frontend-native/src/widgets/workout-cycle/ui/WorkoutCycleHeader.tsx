import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface WorkoutCycleHeaderProps {
  planName?: string;
  cycleName?: string;
  totalSets: number;
  completedSets: number;
  allWorkoutsCompleted: boolean;
  onCompleteCycle: () => void;
}

export default function WorkoutCycleHeader({
  planName,
  cycleName,
  totalSets,
  completedSets,
  allWorkoutsCompleted,
  onCompleteCycle,
}: WorkoutCycleHeaderProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <View
      style={[
        styles.headerCard,
        { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border },
      ]}
    >
      <Text style={[styles.planName, { color: theme.colors.text.primary }]}>
        {t("workout_plan_single.plan_label")} {planName}
      </Text>
      <Text style={[styles.cycleName, { color: theme.colors.text.secondary }]}>
        {cycleName}
      </Text>

      {totalSets > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: theme.colors.text.secondary }]}>
              {t("workout_plan_single.progress")}
            </Text>
            <Text style={[styles.progressText, { color: theme.colors.text.primary }]}>
              {completedSets} / {totalSets} {t("measurements.sets")}
            </Text>
          </View>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: theme.colors.button.primary.background,
                },
              ]}
            />
          </View>
        </View>
      )}

      {allWorkoutsCompleted && (
        <Pressable
          style={[
            styles.completeButton,
            {
              backgroundColor: theme.colors.button.success.background,
            },
          ]}
          onPress={onCompleteCycle}
        >
          <Text
            style={[
              styles.completeButtonText,
              { color: theme.colors.button.success.text },
            ]}
          >
            {t("workout_plan_single.complete_cycle")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  headerCard: {
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[5],
    borderWidth: 1,
    gap: theme.spacing[3],
  },
  planName: {
    fontSize: theme.fontSize.xl,
    fontWeight: "bold",
  },
  cycleName: {
    fontSize: theme.fontSize.md,
  },
  progressContainer: {
    gap: theme.spacing[2],
    marginTop: theme.spacing[2],
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  progressText: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: theme.borderRadius.md,
  },
  completeButton: {
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    marginTop: theme.spacing[2],
  },
  completeButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
});


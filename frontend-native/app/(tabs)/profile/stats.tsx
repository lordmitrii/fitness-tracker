import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/states";
import useStatsHook from "@/src/hooks/data/useStatsHook";
import useSettingsData from "@/src/hooks/data/useSettingsData";
import { toDisplayWeight } from "@/src/utils/numberUtils";
import { e1RM } from "@/src/utils/exerciseStatsUtils";
import CheckBox from "@/src/components/CheckBox";
import ProfileNav from "@/src/components/profile/ProfileNav";
import MuscleGroupRadar from "@/src/components/MuscleGroupRadar";
import { useHapticFeedback } from "@/src/hooks/useHapticFeedback";

const Stats = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { stats, bestPerformances, loading, error, refetch } = useStatsHook();
  const { settings } = useSettingsData();
  const [showE1RM, setShowE1RM] = useState<Record<number, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHapticFeedback();
  const styles = createStyles(theme);

  const filteredStats = useMemo(() => {
    if (!stats || stats.length === 0) return [];
    return stats.filter((s) => s.current_reps && s.current_weight) || [];
  }, [stats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.triggerLight();
    try {
      await refetch();
      haptics.triggerSuccess();
    } catch (error) {
      haptics.triggerError();
      console.error("Error refreshing stats:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, haptics]);

  const toggleE1RM = (id: number) => {
    setShowE1RM((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("exercise_stats.stats") || "Stats",
          })}
        />
        <LoadingState message={t("exercise_stats.loading_stats")} />
      </>
    );
  if (error)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("exercise_stats.stats") || "Stats",
          })}
        />
        <ErrorState error={error} onRetry={refetch} />
      </>
    );

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("exercise_stats.stats") || "Stats",
        })}
      />
      <ScrollView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.button.primary.background}
              colors={[theme.colors.button.primary.background]}
              progressBackgroundColor={theme.colors.background}
            />
          }
        >
          <ProfileNav />
          {filteredStats.length > 0 ? (
            <>
              <View style={[styles.card, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
                <MuscleGroupRadar
                  stats={filteredStats}
                  unitSystem={settings?.unit_system}
                  title={t("exercise_stats.muscle_groups_strength")}
                />
              </View>
              <View style={[styles.card, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {t("exercise_stats.best_performances")}
                </Text>
                {bestPerformances.map((exercise) => {
                  const exerciseId = typeof exercise.id === 'number' ? exercise.id : 0;
                  const exerciseRef = exercise.exercise as { slug?: string } | undefined;
                  const muscleGroup = exercise.muscle_group as { slug?: string } | undefined;
                  const exerciseName = (exercise.name as string | undefined) || t("general.n_a");
                  
                  return (
                  <View
                    key={exercise.id ?? Math.random()}
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
                          onPress={() => toggleE1RM(exerciseId)}
                          style={[
                            styles.performanceValue,
                            {
                              backgroundColor: theme.colors.button.primary.background,
                            },
                          ]}
                        >
                          <Text style={[styles.performanceText, { color: theme.colors.button.primary.text }]}>
                            {!showE1RM[exerciseId] ? (
                              <>
                                {toDisplayWeight(exercise.current_weight, settings?.unit_system)}{" "}
                                {settings?.unit_system === "metric"
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
                                    toDisplayWeight(exercise.current_weight, settings?.unit_system),
                                    exercise.current_reps
                                  )
                                )}{" "}
                                {settings?.unit_system === "metric"
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
                })}
              </View>
            </>
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                {t("exercise_stats.no_stats")}
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>
                {t("exercise_stats.start_logging")}
              </Text>
            </View>
          )}
      </ScrollView>
    </>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing[4],
    gap: theme.spacing[4],
  },
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[6],
    borderWidth: 1,
    gap: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: theme.spacing[2],
  },
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
  emptyContainer: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[8],
    borderWidth: 1,
    alignItems: "center",
    gap: theme.spacing[2],
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: theme.fontSize.base,
    textAlign: "center",
  },
});

export default Stats;

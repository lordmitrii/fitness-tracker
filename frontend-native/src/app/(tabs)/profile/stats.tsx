import { useCallback, useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/shared/ui/states";
import { useStatsHook } from "@/src/entities/stats";
import { useSettingsData } from "@/src/entities/settings";
import { useHapticFeedback } from "@/src/shared/hooks/interaction";
import { ProfileNav } from "@/src/widgets/profile-nav";
import { MuscleGroupRadar } from "@/src/widgets/profile-stats/ui";

import {
  BestPerformancesList,
  StatsEmptyState,
} from "@/src/widgets/profile-stats";
import {
  useFilterStats,
  useToggleE1RM,
} from "@/src/features/stats";

const Stats = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { stats, bestPerformances, loading, error, refetch } = useStatsHook();
  const { settings } = useSettingsData();
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHapticFeedback();
  const styles = createStyles(theme);

  const { filteredStats } = useFilterStats(stats);
  const { showE1RM, toggleE1RM } = useToggleE1RM();

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
            <BestPerformancesList
              performances={bestPerformances}
              unitSystem={settings?.unit_system as "metric" | "imperial" | undefined}
              showE1RM={showE1RM}
              onToggleE1RM={toggleE1RM}
            />
          </>
        ) : (
          <StatsEmptyState />
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
});

export default Stats;

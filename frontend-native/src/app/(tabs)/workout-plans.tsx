import { useCallback, useLayoutEffect, useState } from "react";
import { View, Pressable, RefreshControl, StyleSheet, FlatList, Text } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/shared/ui/states";
import { usePlansData } from "@/src/entities/workout-plan";
import { useCurrentCycleData } from "@/src/entities/current-cycle";
import { MaterialIcons } from "@expo/vector-icons";
import { useHapticFeedback } from "@/src/shared/hooks/interaction";

import {
  WorkoutPlanCard,
  WorkoutPlansEmptyState,
  WorkoutPlanMenu,
} from "@/src/widgets/workout-plans-list";
import {
  useEditPlan,
  useActivatePlan,
  useDeletePlan,
} from "@/src/features/workout-plan";

export default function WorkoutPlansScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showCurrent } = useLocalSearchParams<{ showCurrent?: string }>();
  const styles = createStyles(theme);

  const { currentCycle, refetch: refetchCurrentCycle } = useCurrentCycleData();
  const {
    plans,
    sortedPlans,
    loading,
    error,
    refetch,
    mutations,
  } = usePlansData();
  const [menuPlan, setMenuPlan] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHapticFeedback();

  const { editPlan } = useEditPlan();
  const { activatePlan } = useActivatePlan({
    activatePlanMutation: mutations.activatePlan.mutateAsync,
    onSuccess: () => setMenuPlan(null),
  });
  const { deletePlan } = useDeletePlan({
    deletePlanMutation: mutations.deletePlan.mutateAsync,
  });

  useLayoutEffect(() => {
    if (showCurrent === "true" && plans.length) {
      if (currentCycle) {
        router.replace({
          pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
          params: {
            planID: String(currentCycle.workout_plan_id),
            cycleID: String(currentCycle.id),
          },
        });
      }
    }
  }, [showCurrent, plans, currentCycle]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      haptics.triggerLight();
      await Promise.all([refetch(), refetchCurrentCycle()]);
      haptics.triggerSuccess();
    } catch (error) {
      haptics.triggerError();
      console.error("Error refreshing workout plans:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchCurrentCycle, haptics]);

  const handlePlanPress = (planId: number | string, currentCycleId?: number | string) => {
    if (currentCycleId) {
      router.push({
        pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
        params: {
          planID: String(planId),
          cycleID: String(currentCycleId),
        },
      });
    } else {
      router.push({
        pathname: "/(tabs)/workout-plans/[planID]",
        params: { planID: String(planId) },
      });
    }
  };

  const handleMenuOpen = (plan: any) => {
    setMenuPlan(plan);
  };

  const handleMenuClose = () => {
    setMenuPlan(null);
  };

  const handleEditPlan = (plan: any) => {
    handleMenuClose();
    editPlan(plan.id);
  };

  const handleActivatePlan = (plan: any) => {
    activatePlan(plan.id);
  };

  const handleDeletePlan = (plan: any) => {
    deletePlan(plan);
  };

  if (loading)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("workout_plans.workout_plans") || "Workout Plans",
          })}
        />
        <LoadingState message={t("workout_plans.loading_plans")} />
      </>
    );

  if (error)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("workout_plans.workout_plans") || "Workout Plans",
          })}
        />
        <ErrorState error={error} onRetry={refetch} />
      </>
    );

  const renderPlan = ({ item: workoutPlan }: { item: any }) => (
    <WorkoutPlanCard
      plan={workoutPlan}
      onPress={handlePlanPress}
      onMenuPress={handleMenuOpen}
    />
  );

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("workout_plans.workout_plans") || "Workout Plans",
          headerRight: () => (
            <Pressable
              style={[
                styles.createButton,
                {
                  backgroundColor: theme.colors.button.primary.background,
                },
              ]}
              onPress={() => router.push("/(tabs)/workout-plans/create-workout-plan")}
            >
              <MaterialIcons
                name="add"
                size={20}
                color={theme.colors.button.primary.text}
              />
              <Text
                style={[
                  styles.createButtonText,
                  { color: theme.colors.button.primary.text },
                ]}
              >
                {t("general.create")}
              </Text>
            </Pressable>
          ),
        })}
      />
      <FlatList
        data={sortedPlans}
        renderItem={renderPlan}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          sortedPlans.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.button.primary.background}
            colors={[theme.colors.button.primary.background]}
            progressBackgroundColor={theme.colors.background}
          />
        }
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        ListEmptyComponent={<WorkoutPlansEmptyState />}
      />
      <WorkoutPlanMenu
        plan={menuPlan}
        visible={!!menuPlan}
        onClose={handleMenuClose}
        onActivate={handleActivatePlan}
        onEdit={handleEditPlan}
        onDelete={handleDeletePlan}
      />
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing[4],
    gap: theme.spacing[4],
    flexGrow: 1,
  },
  emptyListContent: {
    justifyContent: "center",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1.5],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing[2],
  },
  createButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
});

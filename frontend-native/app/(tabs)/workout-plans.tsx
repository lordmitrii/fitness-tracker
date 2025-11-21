import { useCallback, useLayoutEffect, useState } from "react";
import { View, Text, Pressable, RefreshControl, StyleSheet, FlatList, Alert } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/states";
import usePlansData from "@/src/hooks/data/usePlansData";
import useCurrentCycleData from "@/src/hooks/data/useCurrentCycleData";
import { MaterialIcons } from "@expo/vector-icons";
import ActionMenu from "@/src/components/common/ActionMenu";
import { useHapticFeedback } from "@/src/hooks/useHapticFeedback";

export default function WorkoutPlansScreen() {
  const { t, i18n } = useTranslation();
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

  const handleMenuOpen = (plan: any, event?: any) => {
    setMenuPlan(plan);
  };

  const handleMenuClose = () => {
    setMenuPlan(null);
  };

  const handleEditPlan = (plan: any) => {
    handleMenuClose();
    router.push({
      pathname: "/(tabs)/workout-plans/update-workout-plan/[planID]",
      params: { planID: String(plan.id) },
    });
  };

  const handleActivatePlan = async (plan: any) => {
    try {
      await mutations.activatePlan.mutateAsync({ planID: plan.id });
      handleMenuClose();
    } catch (error) {
      console.error("Error activating plan:", error);
    }
  };

  const handleDeletePlan = (plan: any) => {
    Alert.alert(
      t("menus.confirm_delete_workout_plan_title") || "Delete Workout Plan",
      t("menus.confirm_delete_workout_plan", { planName: plan.name }) ||
        `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
      [
        {
          text: t("general.cancel") || "Cancel",
          style: "cancel",
        },
        {
          text: t("general.delete") || "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await mutations.deletePlan.mutateAsync({ planID: plan.id });
            } catch (error) {
              console.error("Error deleting plan:", error);
            }
          },
        },
      ]
    );
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
    <Pressable
      style={[
        styles.planCard,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => handlePlanPress(workoutPlan.id, workoutPlan.current_cycle_id)}
    >
      <View style={styles.planHeader}>
        <View style={styles.planTitleContainer}>
          <Text
            style={[styles.planName, { color: theme.colors.text.primary }]}
            numberOfLines={1}
          >
            {workoutPlan.name}
          </Text>
          {workoutPlan.active && (
            <View
              style={[
                styles.activeBadge,
                {
                  backgroundColor: theme.colors.status.success.background,
                  borderColor: theme.colors.status.success.text,
                },
              ]}
            >
              <MaterialIcons
                name="local-fire-department"
                size={16}
                color={theme.colors.status.success.text}
              />
              <Text
                style={[
                  styles.activeText,
                  { color: theme.colors.status.success.text },
                ]}
              >
                {t("general.active")}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleMenuOpen(workoutPlan, e);
          }}
        >
          <MaterialIcons
            name="more-vert"
            size={24}
            color={theme.colors.text.secondary}
          />
        </Pressable>
      </View>
      <Text style={[styles.lastUpdated, { color: theme.colors.text.secondary }]}>
        {t("general.last_updated")}{" "}
        {workoutPlan.updated_at
          ? new Date(workoutPlan.updated_at).toLocaleDateString(i18n.language)
          : t("general.n_a")}
      </Text>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View
      style={[
        styles.emptyContainer,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
        {t("workout_plans.no_plans_found")}
      </Text>
      <Pressable
        style={[
          styles.emptyButton,
          { backgroundColor: theme.colors.button.primary.background },
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
            styles.emptyButtonText,
            { color: theme.colors.button.primary.text },
          ]}
        >
          {t("workout_plans.create_new_plan")}
        </Text>
      </Pressable>
    </View>
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
        ListEmptyComponent={renderEmptyState}
      />
      {menuPlan && (
        <ActionMenu
          visible={!!menuPlan}
          onClose={handleMenuClose}
          items={[
            ...(!menuPlan.active
              ? [
                  {
                    label: t("menus.activate_plan") || t("general.set_active") || "Set Active",
                    icon: "local-fire-department" as const,
                    onPress: () => handleActivatePlan(menuPlan),
                  },
                ]
              : []),
            {
              label: t("menus.update_workout_plan") || t("general.edit") || "Update Workout Plan",
              icon: "edit" as const,
              onPress: () => handleEditPlan(menuPlan),
            },
            {
              label: t("menus.delete_workout_plan") || t("general.delete") || "Delete Workout Plan",
              icon: "delete" as const,
              onPress: () => handleDeletePlan(menuPlan),
              destructive: true,
            },
          ]}
        />
      )}
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
  planCard: {
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[6],
    borderWidth: 1,
    gap: theme.spacing[3],
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    marginRight: theme.spacing[2],
  },
  planName: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
    flex: 1,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
  },
  activeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
  },
  lastUpdated: {
    fontSize: theme.fontSize.sm,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing[8],
    margin: theme.spacing[4],
    borderRadius: theme.borderRadius['2xl'],
    borderWidth: 1,
    gap: theme.spacing[6],
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    textAlign: "center",
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  emptyButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
});

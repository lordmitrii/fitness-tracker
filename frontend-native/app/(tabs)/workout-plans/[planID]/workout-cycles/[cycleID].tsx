import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, Alert, RefreshControl } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/states";
import useCycleData from "@/src/hooks/data/useCycleData";
import usePlansData from "@/src/hooks/data/usePlansData";
import useSettingsData from "@/src/hooks/data/useSettingsData";
import { useHapticFeedback } from "@/src/hooks/useHapticFeedback";
import { MaterialIcons } from "@expo/vector-icons";
import WorkoutExerciseList from "@/src/components/workout/WorkoutExerciseList";
import AddWorkoutExerciseModal from "@/src/components/workout/AddWorkoutExerciseModal";
import ActionMenu from "@/src/components/common/ActionMenu";

type Identifier = string | number;

export default function WorkoutCycleScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const haptics = useHapticFeedback();
  const { planID, cycleID } = useLocalSearchParams<{
    planID: string;
    cycleID: string;
  }>();
  const styles = createStyles(theme);
  const resolvedPlanID = Array.isArray(planID) ? planID[0] : planID;
  const resolvedCycleID = Array.isArray(cycleID) ? cycleID[0] : cycleID;

  const {
    cycle,
    workouts,
    totalSets,
    completedSets,
    allWorkoutsCompleted,
    loading,
    error,
    refetchAll,
    mutations,
  } = useCycleData({ planID: resolvedPlanID, cycleID: resolvedCycleID });

  const { plans } = usePlansData();
  const plan = useMemo(
    () => plans.find((p) => String(p.id) === String(resolvedPlanID)),
    [plans, resolvedPlanID]
  );

  const { settings } = useSettingsData();
  const [exerciseModal, setExerciseModal] = useState<{
    workoutId: Identifier;
    replaceExerciseID?: Identifier;
  } | null>(null);
  const [menuWorkout, setMenuWorkout] = useState<any | null>(null);
  const [menuCycle, setMenuCycle] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.triggerLight();
    try {
      await refetchAll();
      haptics.triggerSuccess();
    } catch (error) {
      haptics.triggerError();
      console.error("Error refreshing cycle data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAll, haptics]);

  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const handleWorkoutPress = (workoutId: Identifier, workoutName?: string) => {
    if (!resolvedPlanID || !resolvedCycleID) return;
    router.push({
      pathname:
        "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]/update-workout/[workoutID]",
      params: {
        planID: String(resolvedPlanID),
        cycleID: String(resolvedCycleID),
        workoutID: String(workoutId),
        workoutName: workoutName ?? "",
      },
    });
  };

  const handleCreateWorkoutPress = useCallback(() => {
    if (!resolvedPlanID || !resolvedCycleID) return;
    router.push({
      pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]/create-workout",
      params: {
        planID: String(resolvedPlanID),
        cycleID: String(resolvedCycleID),
      },
    });
  }, [resolvedPlanID, resolvedCycleID]);

  const handleCompleteCycle = useCallback(async () => {
    if (!allWorkoutsCompleted) {
      return;
    }
    await mutations.completeCycle.mutateAsync(undefined as void);
  }, [allWorkoutsCompleted, mutations.completeCycle]);

  const openAddExercise = useCallback(
    (workoutId: Identifier) => {
      setExerciseModal({ workoutId });
    },
    []
  );

  const openReplaceExercise = useCallback((workoutId: Identifier, exerciseId: Identifier) => {
    setExerciseModal({ workoutId, replaceExerciseID: exerciseId });
  }, []);

  const handleMenuOpen = (workout: any) => {
    setMenuWorkout(workout);
  };

  const handleMenuClose = () => {
    setMenuWorkout(null);
  };

  const handleEditWorkout = (workout: any) => {
    handleWorkoutPress(workout.id, workout.name);
    handleMenuClose();
  };

  const handleDeleteWorkout = (workout: any) => {
    Alert.alert(
      t("menus.confirm_delete_workout_title") || "Delete Workout",
      t("menus.confirm_delete_workout", { workoutName: workout.name }) ||
        `Are you sure you want to delete "${workout.name}"? This action cannot be undone.`,
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
              await mutations.deleteWorkout.mutateAsync({ workoutID: workout.id });
            } catch (error) {
              console.error("Error deleting workout:", error);
            }
          },
        },
      ]
    );
    handleMenuClose();
  };

  const closeExerciseModal = useCallback(() => {
    setExerciseModal(null);
  }, []);

  if (loading)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: cycle?.name || t("workout_plan_single.cycle") || "Cycle",
          })}
        />
        <LoadingState message={t("workout_plan_single.loading_workouts")} />
      </>
    );

  if (error)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: cycle?.name || t("workout_plan_single.cycle") || "Cycle",
          })}
        />
        <ErrorState error={error} onRetry={() => refetchAll()} />
      </>
    );

  const renderWorkout = ({ item: workout }: { item: any }) => (
    <Pressable
      style={[
        styles.workoutCard,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: workout.completed
            ? theme.colors.status.success.border
            : theme.colors.border,
        },
      ]}
      onPress={() => handleWorkoutPress(workout.id, workout.name)}
    >
      <View style={styles.workoutHeader}>
        <View style={styles.workoutTitleContainer}>
          <Text
            style={[styles.workoutName, { color: theme.colors.text.primary }]}
            numberOfLines={1}
          >
            {workout.name}
          </Text>
            {workout.completed && (
            <View
              style={[
                styles.completedBadge,
                {
                  backgroundColor: theme.colors.status.success.background,
                },
              ]}
            >
              <MaterialIcons
                name="check-circle"
                size={16}
                  color={theme.colors.status.success.text}
              />
            </View>
          )}
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleMenuOpen(workout);
          }}
        >
          <MaterialIcons
            name="more-vert"
            size={24}
            color={theme.colors.text.secondary}
          />
        </Pressable>
      </View>

      <Text style={[styles.workoutInfo, { color: theme.colors.text.secondary }]}>
        {t("general.last_updated")}{" "}
        {workout.updated_at
          ? new Date(workout.updated_at).toLocaleDateString()
          : t("general.n_a")}
        {"\n"}
        {t("general.completed")}:{" "}
        <Text
          style={{
            color: workout.completed
              ? theme.colors.status.success.text
              : theme.colors.status.error.text,
            fontWeight: "600",
          }}
        >
          {workout.completed ? t("general.yes") : t("general.no")}
        </Text>
        {workout.completed && workout.estimated_calories && (
          <>
            {"\n"}
            <Text style={{ color: theme.colors.text.tertiary }}>
              {t("workout_plan_single.estimated_calories_burned")}: ~
              {workout.estimated_calories}
            </Text>
          </>
        )}
      </Text>

      {workout.workout_exercises && workout.workout_exercises.length > 0 && (
            <View style={styles.exercisesContainer}>
              <View style={styles.exerciseHeaderRow}>
                <Text style={[styles.exercisesLabel, { color: theme.colors.text.secondary }]}>
                  {t("workout_plan_single.exercises")}: {workout.workout_exercises.length}
                </Text>
              <Pressable
                  style={[
                    styles.addExerciseButton,
                    { backgroundColor: theme.colors.button.secondary?.background || theme.colors.card.background },
                  ]}
                  onPress={() => openAddExercise(workout.id)}
                >
                  <MaterialIcons
                    name="add"
                    size={16}
                    color={theme.colors.button.secondary?.text || theme.colors.button.primary.background}
                  />
                  <Text
                    style={[
                      styles.addExerciseButtonText,
                      { color: theme.colors.button.secondary?.text || theme.colors.button.primary.background },
                    ]}
                  >
                    {t("add_workout_exercise_modal.add_exercise_button")}
                  </Text>
                </Pressable>
              </View>
              <WorkoutExerciseList
                exercises={workout.workout_exercises}
                unitSystem={(settings?.unit_system as "metric" | "imperial") || "metric"}
                planID={resolvedPlanID}
                cycleID={resolvedCycleID}
                workoutID={workout.id}
                onReplaceExercise={(exerciseId) => openReplaceExercise(workout.id, exerciseId)}
                onMoveExercise={async (workoutID, exerciseID, direction) => {
                  try {
                    await mutations.moveExercise.mutateAsync({
                      workoutID,
                      exerciseID,
                      direction,
                    });
                  } catch (error) {
                    console.error("Error moving exercise:", error);
                  }
                }}
                onSkipExercise={async (workoutID, exerciseID) => {
                  try {
                    await mutations.skipExercise.mutateAsync({ workoutID, exerciseID });
                  } catch (error) {
                    console.error("Error skipping exercise:", error);
                  }
                }}
                onDeleteExerciseWithConfirm={async (workoutID, exerciseID) => {
                  try {
                    await mutations.deleteExercise.mutateAsync({ workoutID, exerciseID });
                  } catch (error) {
                    console.error("Error deleting exercise:", error);
                  }
                }}
                onMoveSet={async (workoutID, exerciseID, setID, direction) => {
                  try {
                    await mutations.moveSet.mutateAsync({
                      workoutID,
                      exerciseID,
                      setID,
                      direction,
                    });
                  } catch (error) {
                    console.error("Error moving set:", error);
                  }
                }}
                onAddSetAbove={async (workoutID, exerciseID, setIndex, setTemplate) => {
                  try {
                    await mutations.addSet.mutateAsync({
                      workoutID,
                      exerciseID,
                      index: setIndex,
                      template: setTemplate,
                    });
                  } catch (error) {
                    console.error("Error adding set above:", error);
                  }
                }}
                onAddSetBelow={async (workoutID, exerciseID, setIndex, setTemplate) => {
                  try {
                    await mutations.addSet.mutateAsync({
                      workoutID,
                      exerciseID,
                      index: setIndex + 1,
                      template: setTemplate,
                    });
                  } catch (error) {
                    console.error("Error adding set below:", error);
                  }
                }}
                onSkipSet={async (workoutID, exerciseID, setID) => {
                  try {
                    await mutations.skipSet.mutateAsync({ workoutID, exerciseID, setID });
                  } catch (error) {
                    console.error("Error skipping set:", error);
                  }
                }}
                onDeleteSet={async (workoutID, exerciseID, setID) => {
                  try {
                    await mutations.deleteSet.mutateAsync({ workoutID, exerciseID, setID });
                  } catch (error) {
                    console.error("Error deleting set:", error);
                  }
                }}
              />
            </View>
      )}
    </Pressable>
  );

  const canCreateWorkout = !cycle?.next_cycle_id && !!plan?.active;

  const renderHeader = () => (
    <View
      style={[
        styles.headerCard,
        { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border },
      ]}
    >
      <Text style={[styles.planName, { color: theme.colors.text.primary }]}>
        {t("workout_plan_single.plan_label")} {plan?.name}
      </Text>
      <Text style={[styles.cycleName, { color: theme.colors.text.secondary }]}>
        {cycle?.name}
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
          onPress={handleCompleteCycle}
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

  const renderEmptyWorkouts = () => (
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
        {t("workout_plan_single.no_workouts")}
      </Text>
    </View>
  );

  const renderFooter = () =>
    canCreateWorkout ? (
      <Pressable
        style={[
          styles.createWorkoutButton,
          { backgroundColor: theme.colors.button.primary.background },
        ]}
        onPress={handleCreateWorkoutPress}
      >
        <MaterialIcons
          name="add"
          size={20}
          color={theme.colors.button.primary.text}
        />
        <Text
          style={[
            styles.createWorkoutText,
            { color: theme.colors.button.primary.text },
          ]}
        >
          {t("workout_plan_single.create_workout")}
        </Text>
      </Pressable>
    ) : null;

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: cycle?.name || t("workout_plan_single.cycle") || "Cycle",
          headerRight: () => (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setMenuCycle(true);
              }}
              style={{ paddingRight: 16 }}
            >
              <MaterialIcons
                name="more-vert"
                size={24}
                color={theme.colors.text.primary}
              />
            </Pressable>
          ),
        })}
      />
      <FlatList
        data={workouts}
        renderItem={renderWorkout}
        keyExtractor={(item) => String(item.id)}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: theme.spacing[6] },
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
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={{ marginBottom: theme.spacing[4] }}
        ListEmptyComponent={renderEmptyWorkouts}
        ItemSeparatorComponent={() => (
          <View style={{ height: theme.spacing[4] }} />
        )}
        ListFooterComponent={renderFooter}
        ListFooterComponentStyle={
          canCreateWorkout ? { marginTop: theme.spacing[4] } : undefined
        }
      />
      {resolvedPlanID && resolvedCycleID && exerciseModal && (
        <AddWorkoutExerciseModal
          visible={!!exerciseModal}
          planID={resolvedPlanID}
          cycleID={resolvedCycleID}
          workoutID={exerciseModal.workoutId}
          replaceExerciseID={exerciseModal.replaceExerciseID}
          onClose={closeExerciseModal}
          onSuccess={refetchAll}
        />
      )}
      {menuWorkout && (
        <ActionMenu
          visible={!!menuWorkout}
          onClose={handleMenuClose}
          items={[
            {
              label: t("menus.update_workout") || t("general.edit") || "Update Workout",
              icon: "edit" as const,
              onPress: () => handleEditWorkout(menuWorkout),
            },
            {
              label: t("menus.delete_workout") || t("general.delete") || "Delete Workout",
              icon: "delete" as const,
              onPress: () => handleDeleteWorkout(menuWorkout),
              destructive: true,
            },
          ]}
        />
      )}
      {menuCycle && cycle && (
        <ActionMenu
          visible={menuCycle}
          onClose={() => setMenuCycle(false)}
          items={[
            ...(cycle.previous_cycle_id
              ? [
                  {
                    label: t("menus.previous_cycle") || "Previous Cycle",
                    icon: "arrow-back" as const,
                    onPress: () => {
                      router.push({
                        pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
                        params: {
                          planID: String(resolvedPlanID),
                          cycleID: String(cycle.previous_cycle_id),
                        },
                      });
                      setMenuCycle(false);
                    },
                  },
                ]
              : []),
            ...(cycle.next_cycle_id
              ? [
                  {
                    label: t("menus.next_cycle") || "Next Cycle",
                    icon: "arrow-forward" as const,
                    onPress: () => {
                      router.push({
                        pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
                        params: {
                          planID: String(resolvedPlanID),
                          cycleID: String(cycle.next_cycle_id),
                        },
                      });
                      setMenuCycle(false);
                    },
                  },
                ]
              : []),
            ...(cycle.previous_cycle_id
              ? [
                  {
                    label: t("menus.delete_cycle") || "Delete Cycle",
                    icon: "delete" as const,
                    destructive: true,
                    onPress: () => {
                      Alert.alert(
                        t("menus.confirm_delete_cycle_title") || "Delete Cycle",
                        t("menus.confirm_delete_cycle", { cycleName: cycle.name }) ||
                          `Are you sure you want to delete "${cycle.name}"?`,
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
                                await mutations.deleteCycle.mutateAsync({
                                  previousCycleID: cycle.previous_cycle_id,
                                  nextCycleID: cycle.next_cycle_id,
                                });
                                if (cycle.next_cycle_id) {
                                  router.replace({
                                    pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
                                    params: {
                                      planID: String(resolvedPlanID),
                                      cycleID: String(cycle.next_cycle_id),
                                    },
                                  });
                                } else if (cycle.previous_cycle_id) {
                                  router.replace({
                                    pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
                                    params: {
                                      planID: String(resolvedPlanID),
                                      cycleID: String(cycle.previous_cycle_id),
                                    },
                                  });
                                } else {
                                  router.back();
                                }
                              } catch (error) {
                                console.error("Error deleting cycle:", error);
                              }
                            },
                          },
                        ]
                      );
                      setMenuCycle(false);
                    },
                  },
                ]
              : []),
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
  content: {
    padding: theme.spacing[4],
    flexGrow: 1,
  },
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
  workoutCard: {
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[5],
    borderWidth: 2,
    gap: theme.spacing[3],
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workoutTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    marginRight: theme.spacing[2],
  },
  workoutName: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    flex: 1,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutInfo: {
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },
  exercisesContainer: {
    marginTop: theme.spacing[3],
    gap: theme.spacing[3],
  },
  exerciseHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exercisesLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[2.5],
    paddingVertical: theme.spacing[1.5],
    borderRadius: theme.borderRadius['2xl'],
  },
  addExerciseButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
  },
  emptyContainer: {
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[8],
    borderWidth: 1,
    alignItems: "center",
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    textAlign: "center",
  },
  createWorkoutButton: {
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing[3.5],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[2],
  },
  createWorkoutText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
});

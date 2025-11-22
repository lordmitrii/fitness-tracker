import { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, RefreshControl, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/shared/ui/states";
import { useCycleData } from "@/src/entities/workout-cycle";
import { usePlansData } from "@/src/entities/workout-plan";
import { useSettingsData } from "@/src/entities/settings";
import { useHapticFeedback } from "@/src/shared/hooks/interaction";
import { MaterialIcons } from "@expo/vector-icons";
import { AddWorkoutExerciseModal } from "@/src/widgets/workout-cycle";

import {
  WorkoutCycleHeader,
  WorkoutCard,
  WorkoutCycleActions,
  WorkoutEmptyState,
  WorkoutMenu,
} from "@/src/widgets/workout-cycle";
import {
  useCompleteCycle,
  useWorkoutManagement,
  useDeleteCycle,
} from "@/src/features/workout-cycle";

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

  const { completeCycle } = useCompleteCycle({
    allWorkoutsCompleted,
    completeCycleMutation: () => mutations.completeCycle.mutateAsync({}),
  });

  const { editWorkout, deleteWorkout } = useWorkoutManagement({
    planID: resolvedPlanID!,
    cycleID: resolvedCycleID!,
    deleteWorkoutMutation: mutations.deleteWorkout.mutateAsync,
  });

  const { deleteCycle } = useDeleteCycle({
    planID: resolvedPlanID!,
    deleteCycleMutation: mutations.deleteCycle.mutateAsync,
  });

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

  const handleWorkoutPress = (workoutId: Identifier, workoutName?: string) => {
    if (!resolvedPlanID || !resolvedCycleID) return;
    editWorkout(workoutId, workoutName);
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
    editWorkout(workout.id, workout.name);
    handleMenuClose();
  };

  const handleDeleteWorkout = (workout: any) => {
    deleteWorkout(workout);
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
    <WorkoutCard
      workout={workout}
      unitSystem={(settings?.unit_system as "metric" | "imperial") || "metric"}
      planID={resolvedPlanID!}
      cycleID={resolvedCycleID!}
      onPress={handleWorkoutPress}
      onMenuPress={handleMenuOpen}
      onAddExercise={openAddExercise}
      onReplaceExercise={openReplaceExercise}
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
      onDeleteExercise={async (workoutID, exerciseID) => {
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
  );

  const canCreateWorkout = !cycle?.next_cycle_id && !!plan?.active;

  const renderHeader = () => (
    <WorkoutCycleHeader
      planName={plan?.name}
      cycleName={cycle?.name}
      totalSets={totalSets}
      completedSets={completedSets}
      allWorkoutsCompleted={allWorkoutsCompleted}
      onCompleteCycle={completeCycle}
    />
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
        ListEmptyComponent={<WorkoutEmptyState />}
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
      <WorkoutMenu
        workout={menuWorkout}
        visible={!!menuWorkout}
        onClose={handleMenuClose}
        onEdit={handleEditWorkout}
        onDelete={handleDeleteWorkout}
      />
      <WorkoutCycleActions
        cycle={cycle}
        visible={menuCycle}
        planID={resolvedPlanID!}
        onClose={() => setMenuCycle(false)}
        onDeleteCycle={deleteCycle}
      />
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

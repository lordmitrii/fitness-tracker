import { useState, useCallback, useEffect } from "react";
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl, Pressable, Text } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/shared/ui/states";
import { usePlansData } from "@/src/entities/workout-plan";
import { useHapticFeedback } from "@/src/shared/hooks/interaction";

import { WorkoutPlanNameInput, WorkoutPlanFormCard } from "@/src/widgets/workout-plan-form";
import { useUpdateWorkoutPlan } from "@/src/features/workout-plan";

export default function UpdateWorkoutPlanScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { planID } = useLocalSearchParams<{ planID: string }>();
  const { plans, mutations, refetch, error, loading } = usePlansData({
    skipQuery: true,
  });
  const styles = createStyles(theme);

  const plan = plans.find((p) => String(p.id) === String(planID));
  const [planName, setPlanName] = useState(plan?.name || "");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHapticFeedback();

  const { updatePlan } = useUpdateWorkoutPlan({
    planID: planID!,
    updatePlanMutation: mutations.updatePlan.mutateAsync,
  });

  useEffect(() => {
    if (plan?.name) {
      setPlanName(plan.name);
    }
  }, [plan]);

  const handleSubmit = useCallback(async () => {
    const result = await updatePlan(planName);
    if (result.errors) {
      setFormErrors(result.errors);
    }
  }, [planName, updatePlan]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.triggerLight();
    try {
      await refetch();
      haptics.triggerSuccess();
    } catch (error) {
      haptics.triggerError();
      console.error("Error refreshing workout plan:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, haptics]);

  if (loading)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("update_workout_plan_form.update_workout_plan") || "Update Workout Plan",
          })}
        />
        <LoadingState message={t("update_workout_plan_form.loading_workout_plan")} />
      </>
    );

  if (error)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("update_workout_plan_form.update_workout_plan") || "Update Workout Plan",
          })}
        />
        <ErrorState error={error} onRetry={() => refetch()} />
      </>
    );

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("update_workout_plan_form.update_workout_plan") || "Update Workout Plan",
        })}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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
          <WorkoutPlanFormCard
            title={t("update_workout_plan_form.update_workout_plan") || "Update Workout Plan"}
          >
            <WorkoutPlanNameInput
              value={planName}
              onChangeText={setPlanName}
              error={formErrors.name}
              maxLength={50}
              showCharCount
              label={t("update_workout_plan_form.plan_name_label") || "Plan Name"}
            />

            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: theme.colors.button.primary.background,
                  opacity: mutations.updatePlan.isPending ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={mutations.updatePlan.isPending}
            >
              <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
                {mutations.updatePlan.isPending ? t("general.saving") || "Saving..." : t("general.update")}
              </Text>
            </Pressable>
          </WorkoutPlanFormCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[4],
    flexGrow: 1,
    justifyContent: "center",
  },
  button: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3.5],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
});

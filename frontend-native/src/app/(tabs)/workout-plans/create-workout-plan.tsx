import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { ErrorState } from "@/src/shared/ui/states";
import { usePlansData } from "@/src/entities/workout-plan";

import { WorkoutPlanNameInput, WorkoutPlanFormCard } from "@/src/widgets/workout-plan-form";
import { useCreateWorkoutPlan } from "@/src/features/workout-plan";

export default function CreateWorkoutPlanScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { mutations } = usePlansData();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const styles = createStyles(theme);

  const { createPlan } = useCreateWorkoutPlan({
    createPlanMutation: mutations.createPlanWithWorkouts.mutateAsync,
  });

  const handleSubmit = useCallback(async () => {
    setError(null);
    const result = await createPlan(name, active);
    if (result.error) {
      setError(result.error);
    }
  }, [name, active, createPlan]);

  if (mutations.createPlanWithWorkouts.error) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("general.create_workout_plan") || "Create Workout Plan",
          })}
        />
        <ErrorState
          error={mutations.createPlanWithWorkouts.error}
          onRetry={() => mutations.createPlanWithWorkouts.reset()}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.create_workout_plan") || "Create Workout Plan",
        })}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <WorkoutPlanFormCard
            title={t("workout_plans.create_new_plan") || "Create New Plan"}
            error={error || undefined}
          >
            <WorkoutPlanNameInput
              value={name}
              onChangeText={setName}
              error={error || undefined}
              label={t("workout_plans.plan_name") || "Plan Name"}
            />

            <Pressable
              style={[
                styles.switchContainer,
                {
                  backgroundColor: theme.colors.card.background,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setActive(!active)}
            >
              <View style={styles.switchContent}>
                <Text style={[styles.switchLabel, { color: theme.colors.text.primary }]}>
                  {t("general.active")}
                </Text>
                <Text style={[styles.switchDescription, { color: theme.colors.text.secondary }]}>
                  {t("workout_plans.active_description") || "Set as active workout plan"}
                </Text>
              </View>
              <View
                style={[
                  styles.switch,
                  {
                    backgroundColor: active
                      ? theme.colors.button.primary.background
                      : theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    {
                      backgroundColor: theme.colors.card.background,
                      transform: [{ translateX: active ? 20 : 0 }],
                    },
                  ]}
                />
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: theme.colors.button.primary.background,
                  opacity: mutations.createPlanWithWorkouts.isPending ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={mutations.createPlanWithWorkouts.isPending}
            >
              <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
                {mutations.createPlanWithWorkouts.isPending
                  ? t("general.creating") || "Creating..."
                  : t("general.create")}
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
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
  },
  switchContent: {
    flex: 1,
    gap: theme.spacing[1],
  },
  switchLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
  switchDescription: {
    fontSize: theme.fontSize.sm,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: theme.borderRadius.xl,
    justifyContent: "center",
    padding: theme.spacing[0.5] || 2,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
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

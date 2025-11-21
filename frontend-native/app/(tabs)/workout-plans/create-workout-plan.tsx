import { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/states";
import usePlansData from "@/src/hooks/data/usePlansData";

export default function CreateWorkoutPlanScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { mutations } = usePlansData();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const styles = createStyles(theme);

  const handleSubmit = useCallback(async () => {
    setError(null);

    if (!name.trim()) {
      setError(t("workout_plans.name_required") || "Plan name is required");
      return;
    }

    try {
      const plan = await mutations.createPlanWithWorkouts.mutateAsync({
        name: name.trim(),
        active,
        workouts: [],
      });

      if (plan?.id) {
        router.replace({
          pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
          params: {
            planID: String(plan.id),
            cycleID: String(plan.current_cycle_id),
          },
        });
      }
    } catch (err) {
      console.error("Error creating workout plan:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [name, active, mutations, t]);

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
          <View style={[styles.card, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {t("workout_plans.create_new_plan")}
            </Text>

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: theme.colors.status.error.background }]}>
                <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
                  {error}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                {t("workout_plans.plan_name") || "Plan Name"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                    borderColor: error ? theme.colors.status.error.text : theme.colors.border,
                    color: theme.colors.text.primary,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder={t("workout_plans.plan_name_placeholder") || "Enter plan name"}
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="words"
                autoComplete="off"
              />
            </View>

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
          </View>
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
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[6],
    borderWidth: 1,
    gap: theme.spacing[6],
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: theme.spacing[2],
  },
  errorContainer: {
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  errorText: {
    fontSize: theme.fontSize.base,
  },
  inputContainer: {
    gap: theme.spacing[2],
  },
  label: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
    fontSize: theme.fontSize.md,
    minHeight: 44,
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
    padding: theme.spacing[0.5] || 2, // Very small padding for switch
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10, // Specific to switch thumb size
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

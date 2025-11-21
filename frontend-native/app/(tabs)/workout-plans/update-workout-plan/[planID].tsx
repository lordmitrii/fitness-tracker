import { useState, useCallback, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/states";
import usePlansData from "@/src/hooks/data/usePlansData";
import { useHapticFeedback } from "@/src/hooks/useHapticFeedback";

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

  useEffect(() => {
    if (plan?.name) {
      setPlanName(plan.name);
    }
  }, [plan]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!planName.trim()) {
      newErrors.name = t("update_workout_plan_form.plan_name_required") || "Plan name is required";
    } else if (planName.length > 50) {
      newErrors.name = t("update_workout_plan_form.plan_name_too_long", { limit: 50 }) || "Plan name too long";
    }
    return newErrors;
  }, [planName, t]);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setFormErrors(validationErrors);
      return;
    }
    try {
      await mutations.updatePlan.mutateAsync({
        planID: Number(planID),
        payload: { name: planName.trim() },
      });
      router.replace("/(tabs)/workout-plans");
    } catch (err) {
      console.error("Error updating workout plan:", err);
    }
  }, [validate, planID, planName, mutations]);
  
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
            <View style={[styles.card, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                {t("update_workout_plan_form.update_workout_plan")}
              </Text>

              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                    {t("update_workout_plan_form.plan_name_label") || "Plan Name"}
                  </Text>
                  <Text style={[styles.charCount, { color: theme.colors.text.tertiary }]}>
                    {planName.length}/50
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                      borderColor: formErrors.name ? theme.colors.status.error.text : theme.colors.border,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  value={planName}
                  onChangeText={setPlanName}
                  placeholder={t("update_workout_plan_form.plan_name_placeholder") || "Enter plan name"}
                  placeholderTextColor={theme.colors.text.tertiary}
                  maxLength={50}
                  autoCapitalize="words"
                  autoComplete="off"
                />
                {formErrors.name && (
                  <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
                    {formErrors.name}
                  </Text>
                )}
              </View>

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
  inputContainer: {
    gap: theme.spacing[2],
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  charCount: {
    fontSize: theme.fontSize.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
    fontSize: theme.fontSize.md,
    minHeight: 44,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing[1],
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

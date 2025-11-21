import { useLayoutEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { useTranslation } from "react-i18next";
import usePlansData from "@/src/hooks/data/usePlansData";

export default function WorkoutPlanDetailScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { planID } = useLocalSearchParams<{ planID: string }>();
  const { plans } = usePlansData();

  useLayoutEffect(() => {
    const plan = plans.find((p) => String(p.id) === String(planID));
    if (plan && plan.current_cycle_id) {
      router.replace({
        pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
        params: {
          planID: String(planID),
          cycleID: String(plan.current_cycle_id),
        },
      });
    } else {
      router.replace("/(tabs)/workout-plans");
    }
  }, [planID, plans]);

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("workout_plans.workout_plan") || "Workout Plan",
        })}
      />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.button.primary.background} />
      </View>
    </>
  );
}

import { useCallback } from "react";
import { View, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { QK } from "@/src/shared/utils/query";
import { fetchCurrentCycle } from "@/src/entities/current-cycle";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { useTranslation } from "react-i18next";

export default function CurrentWorkoutScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const qc = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      console.log("[redirect] focus");
      let cancelled = false;

      const redirect = async () => {
        try {
          const cur = await qc.ensureQueryData({
            queryKey: QK.currentCycle,
            queryFn: fetchCurrentCycle,
          });
          console.log("[redirect] fetched currentCycle", cur);
          if (cancelled) return;

          if (cur?.workout_plan_id && cur?.id) {
            console.log("[redirect] navigating to cycle", cur);
            const pid = String(cur.workout_plan_id);
            const cid = String(cur.id);

            router.replace({
              pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
              params: {
                planID: pid,
                cycleID: cid,
              },
            });
          } else {
            console.log("[redirect] navigating to /workout-plans");
            router.replace("/(tabs)/workout-plans");
          }
        } catch (err) {
          console.log("[redirect] fetch failed", err);
          router.replace("/(tabs)/workout-plans");
        }
      };

      void redirect();

      return () => {
        console.log("[redirect] cleanup");
        cancelled = true;
      };
    }, [qc])
  );

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.workout") || "Current Workout",
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

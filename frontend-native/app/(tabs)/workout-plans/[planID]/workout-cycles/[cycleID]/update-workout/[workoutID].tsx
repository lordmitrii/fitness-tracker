import { View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, Stack } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";

export default function UpdateWorkoutScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { planID, cycleID, workoutID } = useLocalSearchParams<{
    planID: string;
    cycleID: string;
    workoutID: string;
  }>();

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.update_workout") || "Update Workout",
        })}
      />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: theme.spacing[4],
        }}
      >
        <Text style={theme.typography.body}>
          Update Workout {workoutID} (Plan {planID}, Cycle {cycleID}) - Coming soon
        </Text>
      </View>
    </>
  );
}


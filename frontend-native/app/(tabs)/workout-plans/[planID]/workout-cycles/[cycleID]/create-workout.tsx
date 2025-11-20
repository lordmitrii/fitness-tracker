import { View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, Stack } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";

export default function CreateWorkoutScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { planID, cycleID } = useLocalSearchParams<{
    planID: string;
    cycleID: string;
  }>();

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.create_workout") || "Create Workout",
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
          Create Workout (Plan {planID}, Cycle {cycleID}) - Coming soon
        </Text>
      </View>
    </>
  );
}


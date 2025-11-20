import { View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";

export default function WorkoutPlansScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.plans"),
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
          {t("general.plans")} - Coming soon
        </Text>
      </View>
    </>
  );
}


import { View, Text, ScrollView } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";

export default function InstallationGuideScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("installation_guide.installation_guide") || "Installation Guide",
        })}
      />
      <ScrollView
        style={{
          flex: 1,
          padding: theme.spacing[4],
        }}
      >
        <Text style={theme.typography.body}>Installation Guide - Coming soon</Text>
      </ScrollView>
    </>
  );
}


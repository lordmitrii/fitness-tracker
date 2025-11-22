import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { useVersions } from "@/src/entities/version";

export default function HealthDataPolicyScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { getVersion } = useVersions();
  const styles = createStyles(theme);

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("health_data_policy.title") || "Health Data Policy",
        })}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {t("health_data_policy.title")}
          </Text>
          <Text style={[styles.version, { color: theme.colors.text.secondary }]}>
            v{getVersion("healthDataPolicy")}
          </Text>
        </View>

        <Text style={[styles.intro, { color: theme.colors.text.secondary }]}>
          {t("health_data_policy.intro") || "Health Data Policy content..."}
        </Text>

        {/* Add more sections as needed */}
      </ScrollView>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing[4],
    gap: theme.spacing[6],
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: "bold",
  },
  version: {
    fontSize: theme.fontSize.base,
    marginBottom: 2, // Very small margin for visual alignment
  },
  intro: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.normal,
  },
});

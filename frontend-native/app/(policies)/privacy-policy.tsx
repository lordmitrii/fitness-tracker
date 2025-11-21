import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTranslation, Trans } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import useVersionsData from "@/src/hooks/data/userVersionsData";
import { router } from "expo-router";

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { getVersion } = useVersionsData();
  const styles = createStyles(theme);

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("privacy_policy.title") || "Privacy Policy",
        })}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {t("privacy_policy.title")}
          </Text>
          <Text style={[styles.version, { color: theme.colors.text.secondary }]}>
            v{getVersion("privacyPolicy")}
          </Text>
        </View>

        <Text style={[styles.intro, { color: theme.colors.text.secondary }]}>
          {t("privacy_policy.intro")}
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            {t("privacy_policy.sections.information_we_collect.title")}
          </Text>
          <Text style={[styles.sectionText, { color: theme.colors.text.secondary }]}>
            {t("privacy_policy.sections.information_we_collect.description")}
          </Text>
          <View style={styles.list}>
            <Text style={[styles.listItem, { color: theme.colors.text.secondary }]}>
              • {t("privacy_policy.sections.information_we_collect.list.personal_info")}
            </Text>
            <Text style={[styles.listItem, { color: theme.colors.text.secondary }]}>
              • {t("privacy_policy.sections.information_we_collect.list.usage_data")}
            </Text>
            <Text style={[styles.listItem, { color: theme.colors.text.secondary }]}>
              • {t("privacy_policy.sections.information_we_collect.list.cookies")}
            </Text>
            <Text style={[styles.listItem, { color: theme.colors.text.secondary }]}>
              •{" "}
              <Trans
                i18nKey="privacy_policy.sections.information_we_collect.list.health_data"
                components={[
                  <Text
                    key="health-data-link"
                    style={[styles.link, { color: theme.colors.button.primary.background }]}
                    onPress={() => router.push("/(policies)/health-data-policy")}
                  >
                    {t("general.health_data_policy")}
                  </Text>,
                ]}
              />
            </Text>
          </View>
        </View>

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
  section: {
    gap: theme.spacing[3],
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
  },
  sectionText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.normal,
  },
  list: {
    gap: theme.spacing[2],
    marginLeft: theme.spacing[4],
  },
  listItem: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.normal,
  },
  link: {
    textDecorationLine: "underline",
  },
});

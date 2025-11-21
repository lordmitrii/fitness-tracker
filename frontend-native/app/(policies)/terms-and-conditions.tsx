import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";

export default function TermsAndConditionsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("terms_and_conditions.title") || "Terms and Conditions",
        })}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {t("terms_and_conditions.title")}
        </Text>
        <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
          {t("terms_and_conditions.content") || "Terms and Conditions content..."}
        </Text>
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
    gap: theme.spacing[4],
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: "bold",
  },
  text: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.normal,
  },
});

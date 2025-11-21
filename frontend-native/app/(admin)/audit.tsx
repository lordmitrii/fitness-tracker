import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { MaterialIcons } from "@expo/vector-icons";

export default function AuditScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("admin.audit") || "Audit Log",
        })}
      />
      <View
        style={[
          styles.container,
          {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: theme.spacing[4],
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <MaterialIcons
          name="history"
          size={64}
          color={theme.colors.text.tertiary}
          style={styles.icon}
        />
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {t("admin.audit") || "Audit Log"}
        </Text>
        <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
          {t("admin.audit_coming_soon") || "Audit log functionality is not yet available. This feature will be implemented in a future update."}
        </Text>
      </View>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  icon: {
    marginBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: "600",
    marginBottom: theme.spacing[2],
    textAlign: "center",
  },
  text: {
    fontSize: theme.fontSize.base,
    textAlign: "center",
    lineHeight: theme.lineHeight.normal,
    paddingHorizontal: theme.spacing[8],
  },
});

import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { MaterialIcons } from "@expo/vector-icons";

export default function AdminScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const adminSections = [
    {
      title: t("admin.users") || "Users",
      route: "/(admin)/users",
      icon: "people",
      description: t("admin.manage_users") || "Manage user accounts and permissions",
    },
    {
      title: t("admin.roles") || "Roles",
      route: "/(admin)/roles",
      icon: "admin-panel-settings",
      description: t("admin.manage_roles") || "Manage user roles and permissions",
    },
    {
      title: t("admin.audit") || "Audit Log",
      route: "/(admin)/audit",
      icon: "history",
      description: t("admin.view_audit_log") || "View system audit logs",
    },
    {
      title: t("general.exercises_and_muscles") || "Exercises and Muscles",
      route: "/(admin)/exercises-and-muscles",
      icon: "fitness-center",
      description: t("admin.manage_exercises") || "Manage exercises and muscle groups",
    },
  ];

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("admin.title_main") || "Admin Panel",
        })}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
          {t("admin.description") || "Manage system settings and user accounts"}
        </Text>

        {adminSections.map((section) => (
          <Pressable
            key={section.route}
            style={[
              styles.sectionCard,
              {
                backgroundColor: theme.colors.card.background,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => router.push(section.route as any)}
          >
            <View style={styles.sectionContent}>
              <View style={styles.sectionHeader}>
                <MaterialIcons
                  name={section.icon as any}
                  size={24}
                  color={theme.colors.button.primary.background}
                />
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {section.title}
                </Text>
              </View>
              <Text style={[styles.sectionDescription, { color: theme.colors.text.secondary }]}>
                {section.description}
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.colors.text.tertiary}
            />
          </Pressable>
        ))}
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
  description: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.normal,
    marginBottom: theme.spacing[2],
  },
  sectionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[5],
    borderWidth: 1,
    gap: theme.spacing[4],
  },
  sectionContent: {
    flex: 1,
    gap: theme.spacing[2],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
  },
  sectionDescription: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.normal,
    marginLeft: 36,
  },
});

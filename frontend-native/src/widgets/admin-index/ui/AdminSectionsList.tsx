import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import AdminSectionCard from "./AdminSectionCard";

interface AdminSection {
  title: string;
  route: string;
  icon: string;
  description: string;
}

interface AdminSectionsListProps {
  sections: AdminSection[];
  onSectionPress: (route: string) => void;
}

export default function AdminSectionsList({
  sections,
  onSectionPress,
}: AdminSectionsListProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
        {t("admin.description") || "Manage system settings and user accounts"}
      </Text>

      {sections.map((section) => (
        <AdminSectionCard
          key={section.route}
          section={section}
          onPress={onSectionPress}
        />
      ))}
    </ScrollView>
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
});


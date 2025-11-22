import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

interface AdminSection {
  title: string;
  route: string;
  icon: string;
  description: string;
}

interface AdminSectionCardProps {
  section: AdminSection;
  onPress: (route: string) => void;
}

export default function AdminSectionCard({
  section,
  onPress,
}: AdminSectionCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      style={[
        styles.sectionCard,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => onPress(section.route)}
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
  );
}

const createStyles = (theme: any) => StyleSheet.create({
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


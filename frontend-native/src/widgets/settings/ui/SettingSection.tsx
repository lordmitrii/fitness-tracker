import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { ReactNode } from "react";

interface SettingSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function SettingSection({
  title,
  description,
  children,
}: SettingSectionProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      style={[
        styles.settingCard,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
          {title}
        </Text>
        {description && (
          <Text
            style={[styles.settingDescription, { color: theme.colors.text.secondary }]}
          >
            {description}
          </Text>
        )}
        {children}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  settingCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[5],
    borderWidth: 1,
  },
  settingContent: {
    gap: theme.spacing[2],
  },
  settingTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.normal,
  },
});


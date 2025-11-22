import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function StatsEmptyState() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View style={[styles.emptyContainer, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
      <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
        {t("exercise_stats.no_stats")}
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>
        {t("exercise_stats.start_logging")}
      </Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  emptyContainer: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[8],
    borderWidth: 1,
    alignItems: "center",
    gap: theme.spacing[2],
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: theme.fontSize.base,
    textAlign: "center",
  },
});


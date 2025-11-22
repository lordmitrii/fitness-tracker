import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function WorkoutEmptyState() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View
      style={[
        styles.emptyContainer,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
        {t("workout_plan_single.no_workouts")}
      </Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  emptyContainer: {
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[8],
    borderWidth: 1,
    alignItems: "center",
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    textAlign: "center",
  },
});


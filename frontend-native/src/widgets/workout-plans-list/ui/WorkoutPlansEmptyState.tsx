import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface WorkoutPlansEmptyStateProps {
  onCreatePress?: () => void;
  message?: string;
  buttonLabel?: string;
}

export default function WorkoutPlansEmptyState({
  onCreatePress,
  message,
  buttonLabel,
}: WorkoutPlansEmptyStateProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const handleCreate = () => {
    if (onCreatePress) {
      onCreatePress();
    } else {
      router.push("/(tabs)/workout-plans/create-workout-plan");
    }
  };

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
        {message || t("workout_plans.no_plans_found")}
      </Text>
      <Pressable
        style={[
          styles.emptyButton,
          { backgroundColor: theme.colors.button.primary.background },
        ]}
        onPress={handleCreate}
      >
        <MaterialIcons
          name="add"
          size={20}
          color={theme.colors.button.primary.text}
        />
        <Text
          style={[
            styles.emptyButtonText,
            { color: theme.colors.button.primary.text },
          ]}
        >
          {buttonLabel || t("workout_plans.create_new_plan")}
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing[8],
    margin: theme.spacing[4],
    borderRadius: theme.borderRadius['2xl'],
    borderWidth: 1,
    gap: theme.spacing[6],
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    textAlign: "center",
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  emptyButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
});


import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface WorkoutPlan {
  id: number | string;
  name: string;
  active?: boolean;
  updated_at?: string;
  current_cycle_id?: number | string;
}

interface WorkoutPlanCardProps {
  plan: WorkoutPlan;
  onPress: (planId: number | string, currentCycleId?: number | string) => void;
  onMenuPress: (plan: WorkoutPlan, event?: any) => void;
}

export default function WorkoutPlanCard({
  plan,
  onPress,
  onMenuPress,
}: WorkoutPlanCardProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = createStyles(theme);

  return (
    <Pressable
      style={[
        styles.planCard,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => onPress(plan.id, plan.current_cycle_id)}
    >
      <View style={styles.planHeader}>
        <View style={styles.planTitleContainer}>
          <Text
            style={[styles.planName, { color: theme.colors.text.primary }]}
            numberOfLines={1}
          >
            {plan.name}
          </Text>
          {plan.active && (
            <View
              style={[
                styles.activeBadge,
                {
                  backgroundColor: theme.colors.status.success.background,
                  borderColor: theme.colors.status.success.text,
                },
              ]}
            >
              <MaterialIcons
                name="local-fire-department"
                size={16}
                color={theme.colors.status.success.text}
              />
              <Text
                style={[
                  styles.activeText,
                  { color: theme.colors.status.success.text },
                ]}
              >
                {t("general.active")}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onMenuPress(plan, e);
          }}
        >
          <MaterialIcons
            name="more-vert"
            size={24}
            color={theme.colors.text.secondary}
          />
        </Pressable>
      </View>
      <Text style={[styles.lastUpdated, { color: theme.colors.text.secondary }]}>
        {t("general.last_updated")}{" "}
        {plan.updated_at
          ? new Date(plan.updated_at).toLocaleDateString(i18n.language)
          : t("general.n_a")}
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  planCard: {
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[6],
    borderWidth: 1,
    gap: theme.spacing[3],
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    marginRight: theme.spacing[2],
  },
  planName: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
    flex: 1,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
  },
  activeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
  },
  lastUpdated: {
    fontSize: theme.fontSize.sm,
  },
});


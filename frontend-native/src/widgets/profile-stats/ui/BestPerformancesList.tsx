import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import BestPerformanceCard from "./BestPerformanceCard";

interface BestPerformance {
  id: string | number;
  name?: string;
  exercise?: { slug?: string };
  muscle_group?: { slug?: string };
  current_reps?: number;
  current_weight?: number;
  is_bodyweight?: boolean;
  is_time_based?: boolean;
}

interface BestPerformancesListProps {
  performances: BestPerformance[];
  unitSystem?: "metric" | "imperial";
  showE1RM: Record<number, boolean>;
  onToggleE1RM: (id: number) => void;
}

export default function BestPerformancesList({
  performances,
  unitSystem = "metric",
  showE1RM,
  onToggleE1RM,
}: BestPerformancesListProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        {t("exercise_stats.best_performances")}
      </Text>
      {performances.map((exercise) => {
        const exerciseId = typeof exercise.id === 'number' ? exercise.id : 0;
        return (
          <BestPerformanceCard
            key={exercise.id ?? Math.random()}
            exercise={exercise}
            unitSystem={unitSystem}
            showE1RM={showE1RM[exerciseId] || false}
            onToggleE1RM={() => onToggleE1RM(exerciseId)}
          />
        );
      })}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[6],
    borderWidth: 1,
    gap: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: theme.spacing[2],
  },
});


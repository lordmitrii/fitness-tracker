import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { ReactNode } from "react";

interface WorkoutPlanFormCardProps {
  title: string;
  children: ReactNode;
  error?: string;
}

export default function WorkoutPlanFormCard({
  title,
  children,
  error,
}: WorkoutPlanFormCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        {title}
      </Text>

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.status.error.background }]}>
          <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
            {error}
          </Text>
        </View>
      )}

      {children}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[6],
    borderWidth: 1,
    gap: theme.spacing[6],
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: theme.spacing[2],
  },
  errorContainer: {
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  errorText: {
    fontSize: theme.fontSize.base,
  },
});


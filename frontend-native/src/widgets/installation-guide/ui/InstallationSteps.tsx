import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

interface InstallationStepsProps {
  steps: string[];
}

export function InstallationSteps({ steps }: InstallationStepsProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.stepsContainer}>
      {steps.map((step, index) => (
        <View
          key={index}
          style={[
            styles.stepCard,
            {
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.stepNumber, { color: theme.colors.button.primary.background }]}>
            {index + 1}
          </Text>
          <Text style={[styles.stepText, { color: theme.colors.text.primary }]}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  stepsContainer: {
    gap: theme.spacing[3],
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing[3],
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
  },
  stepNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: "bold",
    minWidth: 24,
  },
  stepText: {
    flex: 1,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.normal,
  },
});


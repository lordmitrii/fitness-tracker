import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface ProfileHealthEmptyStateProps {
  unitSystem?: "metric" | "imperial";
}

export default function ProfileHealthEmptyState({
  unitSystem = "metric",
}: ProfileHealthEmptyStateProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
        {t("profile.no_profile_found")}
      </Text>
      <Pressable
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.button.primary.background,
          },
        ]}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/profile/health/create-profile",
            params: { unit_system: unitSystem },
          })
        }
      >
        <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
          {t("general.create_profile")}
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    gap: theme.spacing[4],
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    textAlign: "center",
  },
  button: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3.5],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
});


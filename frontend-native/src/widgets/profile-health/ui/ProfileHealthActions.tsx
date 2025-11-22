import { View, Pressable, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface Profile {
  [key: string]: unknown;
}

interface ProfileHealthActionsProps {
  profile: Profile;
  unitSystem?: "metric" | "imperial";
}

export default function ProfileHealthActions({
  profile,
  unitSystem = "metric",
}: ProfileHealthActionsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.button.primary.background,
        },
      ]}
      onPress={() =>
        router.push({
          pathname: "/(tabs)/profile/health/update-profile",
          params: { profile: JSON.stringify(profile), unit_system: unitSystem },
        })
      }
    >
      <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
        {t("general.update")}
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
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


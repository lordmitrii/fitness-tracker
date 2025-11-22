import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { toDisplayHeight, toDisplayWeight } from "@/src/shared/utils/formatting";

interface Profile {
  age?: number;
  weight?: number;
  height?: number;
  sex?: string;
}

interface ProfileHealthGridProps {
  profile: Profile;
  unitSystem?: "metric" | "imperial";
}

export default function ProfileHealthGrid({
  profile,
  unitSystem = "metric",
}: ProfileHealthGridProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View style={styles.grid}>
      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        {t("profile.age_label")}
      </Text>
      <Text style={[styles.value, { color: theme.colors.text.secondary }]}>
        {profile.age as number}
      </Text>

      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        {t("profile.weight_label")}
      </Text>
      <Text style={[styles.value, { color: theme.colors.text.secondary }]}>
        {toDisplayWeight(profile.weight as number, unitSystem)}{" "}
        {unitSystem === "metric"
          ? t("measurements.weight.kg")
          : t("measurements.weight.lbs_of")}
      </Text>

      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        {t("profile.height_label")}
      </Text>
      <Text style={[styles.value, { color: theme.colors.text.secondary }]}>
        {toDisplayHeight(profile.height as number, unitSystem)}{" "}
        {unitSystem === "metric"
          ? t("measurements.height.cm")
          : t("measurements.height.ft_of")}
      </Text>

      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        {t("profile.sex_label")}
      </Text>
      <Text style={[styles.value, { color: theme.colors.text.secondary, textTransform: "capitalize" }]}>
        {t(`profile_form.sex_${profile.sex}`)}
      </Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
  label: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    flex: 1,
    minWidth: "45%",
  },
  value: {
    fontSize: theme.fontSize.base,
    textAlign: "right",
    flex: 1,
    minWidth: "45%",
  },
});


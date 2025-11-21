import { useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import useProfileData from "@/src/hooks/data/useProfileData";
import { LoadingState, ErrorState } from "@/src/states";
import PullToRefresh from "@/src/components/common/PullToRefresh";
import useSettingsData from "@/src/hooks/data/useSettingsData";
import { toDisplayHeight, toDisplayWeight } from "@/src/utils/numberUtils";
import ProfileNav from "@/src/components/profile/ProfileNav";

const Health = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { settings } = useSettingsData();
  const { profile, loading, error, refetch } = useProfileData();
  const styles = createStyles(theme);

  const isEmpty = !profile || Object.keys(profile).length === 0;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (loading && isEmpty) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("profile.your_profile") || "Your Profile",
          })}
        />
        <LoadingState message={t("profile.loading_profile")} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("profile.your_profile") || "Your Profile",
          })}
        />
        <ErrorState error={error} onRetry={refetch} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("profile.your_profile") || "Your Profile",
        })}
      />
      <PullToRefresh onRefresh={handleRefresh}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <ProfileNav />
          <View style={[styles.card, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {t("profile.your_profile")}
            </Text>

            {!!profile && Object.keys(profile).length > 0 ? (
              <>
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
                    {toDisplayWeight(profile.weight as number, settings?.unit_system)}{" "}
                    {settings?.unit_system === "metric"
                      ? t("measurements.weight.kg")
                      : t("measurements.weight.lbs_of")}
                  </Text>

                  <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                    {t("profile.height_label")}
                  </Text>
                  <Text style={[styles.value, { color: theme.colors.text.secondary }]}>
                    {toDisplayHeight(profile.height as number, settings?.unit_system)}{" "}
                    {settings?.unit_system === "metric"
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
                      params: { profile: JSON.stringify(profile), unit_system: settings?.unit_system || "metric" },
                    })
                  }
                >
                  <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
                    {t("general.update")}
                  </Text>
                </Pressable>
              </>
            ) : (
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
                      params: { unit_system: settings?.unit_system || "metric" },
                    })
                  }
                >
                  <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
                    {t("general.create_profile")}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </PullToRefresh>
    </>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing[4],
  },
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
  emptyContainer: {
    alignItems: "center",
    gap: theme.spacing[4],
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    textAlign: "center",
  },
});

export default Health;

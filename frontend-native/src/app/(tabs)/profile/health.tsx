import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { useProfileData } from "@/src/entities/profile";
import { LoadingState, ErrorState } from "@/src/shared/ui/states";
import { useSettingsData } from "@/src/entities/settings";
import { ProfileNav } from "@/src/widgets/profile-nav";
import { useHapticFeedback } from "@/src/shared/hooks/interaction";

import {
  ProfileHealthCard,
  ProfileHealthGrid,
  ProfileHealthEmptyState,
  ProfileHealthActions,
} from "@/src/widgets/profile-health";

const Health = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { settings } = useSettingsData();
  const { profile, loading, error, refetch } = useProfileData();
  const styles = createStyles(theme);
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHapticFeedback();

  const isEmpty = !profile || Object.keys(profile).length === 0;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.triggerLight();
    try {
      await refetch();
      haptics.triggerSuccess();
    } catch (error) {
      haptics.triggerError();
      console.error("Error refreshing profile:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, haptics]);

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
      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background, flexGrow: 1 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.button.primary.background}
            colors={[theme.colors.button.primary.background]}
            progressBackgroundColor={theme.colors.background}
          />
        }
      >
        <ProfileNav />
        <ProfileHealthCard>
          {!!profile && Object.keys(profile).length > 0 ? (
            <>
              <ProfileHealthGrid
                profile={profile}
                unitSystem={settings?.unit_system as "metric" | "imperial" | undefined}
              />
              <ProfileHealthActions
                profile={profile}
                unitSystem={settings?.unit_system as "metric" | "imperial" | undefined}
              />
            </>
          ) : (
            <ProfileHealthEmptyState
              unitSystem={settings?.unit_system as "metric" | "imperial" | undefined}
            />
          )}
        </ProfileHealthCard>
      </ScrollView>
    </>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing[4],
  },
});

export default Health;

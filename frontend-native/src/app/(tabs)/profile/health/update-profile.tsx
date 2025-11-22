import { useCallback, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/shared/ui/states";
import { ProfileForm } from "@/src/widgets/profile-form";
import { useProfileData } from "@/src/entities/profile";
import { useHapticFeedback } from "@/src/shared/hooks/interaction";

export default function UpdateProfileForm() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { profile: profileParam, unit_system } = useLocalSearchParams<{
    profile?: string;
    unit_system?: string;
  }>();

  const { loading, error, refetch, mutations } = useProfileData({
    skipQuery: true,
  });
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHapticFeedback();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.triggerLight();
    try {
      await refetch();
      haptics.triggerSuccess();
    } catch (error) {
      haptics.triggerError();
      console.error("Error refreshing profile data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, haptics]);

  const handleUpdate = (payload: { age: number; weight: number; height: number; sex: string }) => {
    mutations.upsert.mutate(payload, {
      onSuccess: () => {
        router.replace("/(tabs)/profile/health");
      },
      onError: (err) => {
        console.error("Error updating profile:", err);
      },
    });
  };

  let initialData;
  try {
    initialData = profileParam ? JSON.parse(profileParam) : undefined;
  } catch {
    initialData = undefined;
  }

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("profile_form.update_profile") || "Update Profile",
          })}
        />
        <LoadingState message={t("profile.loading_profile")} />
      </>
    );
  }

  if (mutations.upsert.error || error) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("profile_form.update_profile") || "Update Profile",
          })}
        />
        <ErrorState
          error={mutations.upsert.error || error}
          onRetry={() => {
            mutations.upsert.reset();
            refetch();
            router.replace("/(tabs)/profile/health");
          }}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("profile_form.update_profile") || "Update Profile",
        })}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ flexGrow: 1, padding: theme.spacing?.[4] ?? 16 }}
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
        <ProfileForm
          key={initialData?.id ?? JSON.stringify(initialData)}
          initialData={initialData}
          onSubmit={handleUpdate}
          label={t("profile_form.update_profile")}
          submitLabel={t("general.update")}
          submitting={mutations.upsert.isPending}
          unitSystem={(unit_system as "metric" | "imperial") || "metric"}
        />
      </ScrollView>
    </>
  );
}

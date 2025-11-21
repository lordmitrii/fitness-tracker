import { useCallback } from "react";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/states";
import ProfileForm from "@/src/components/ProfileForm";
import useProfileData from "@/src/hooks/data/useProfileData";
import PullToRefresh from "@/src/components/common/PullToRefresh";

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

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

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
      <PullToRefresh onRefresh={handleRefresh}>
        <ProfileForm
          key={initialData?.id ?? JSON.stringify(initialData)}
          initialData={initialData}
          onSubmit={handleUpdate}
          label={t("profile_form.update_profile")}
          submitLabel={t("general.update")}
          submitting={mutations.upsert.isPending}
          unitSystem={(unit_system as "metric" | "imperial") || "metric"}
        />
      </PullToRefresh>
    </>
  );
}

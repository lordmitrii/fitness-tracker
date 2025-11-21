import { useCallback } from "react";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { ErrorState } from "@/src/states";
import ProfileForm from "@/src/components/ProfileForm";
import useProfileData from "@/src/hooks/data/useProfileData";
import PullToRefresh from "@/src/components/common/PullToRefresh";

export default function CreateProfileForm() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { unit_system } = useLocalSearchParams<{ unit_system?: string }>();
  const { refetch, mutations } = useProfileData({ skipQuery: true });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleCreate = (payload: { age: number; weight: number; height: number; sex: string }) => {
    mutations.create.mutate(payload, {
      onSuccess: () => router.replace("/(tabs)/profile/health"),
      onError: (err) => {
        console.error("Error creating profile:", err);
      },
    });
  };

  if (mutations.create.error)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("profile_form.create_profile") || "Create Profile",
          })}
        />
        <ErrorState
          error={mutations.create.error}
          onRetry={() => {
            mutations.create.reset();
            refetch();
            router.replace("/(tabs)/profile/health");
          }}
        />
      </>
    );

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("profile_form.create_profile") || "Create Profile",
        })}
      />
      <PullToRefresh onRefresh={handleRefresh}>
        <ProfileForm
          onSubmit={handleCreate}
          label={t("profile_form.create_profile")}
          submitLabel={t("general.create")}
          submitting={mutations.create.isPending}
          unitSystem={(unit_system as "metric" | "imperial") || "metric"}
        />
      </PullToRefresh>
    </>
  );
}

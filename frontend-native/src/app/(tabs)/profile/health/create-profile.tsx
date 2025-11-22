import { useCallback, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { ErrorState } from "@/src/shared/ui/states";
import { ProfileForm } from "@/src/widgets/profile-form";
import { useProfileData } from "@/src/entities/profile";
import { useHapticFeedback } from "@/src/shared/hooks/interaction";

export default function CreateProfileForm() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { unit_system } = useLocalSearchParams<{ unit_system?: string }>();
  const { refetch, mutations } = useProfileData({ skipQuery: true });
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
      console.error("Error refreshing profile form:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, haptics]);

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
          onSubmit={handleCreate}
          label={t("profile_form.create_profile")}
          submitLabel={t("general.create")}
          submitting={mutations.create.isPending}
          unitSystem={(unit_system as "metric" | "imperial") || "metric"}
        />
      </ScrollView>
    </>
  );
}

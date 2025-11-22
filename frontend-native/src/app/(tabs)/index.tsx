import { View, Text, Pressable, ScrollView, RefreshControl } from "react-native";
import { useAuth } from "@/src/shared/lib/context/AuthContext";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useState, useCallback } from "react";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useHapticFeedback } from "@/src/shared/hooks/interaction";
import InstallIcon from "@/src/shared/ui/icons/InstallIcon";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/shared/ui/states";

export default function HomeScreen() {
  const { isAuth } = useAuth();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const haptics = useHapticFeedback();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    console.log("[HomeScreen] Pull-to-refresh triggered!");
    console.log("[HomeScreen] Mock refetch - simulating data refresh...");

    setRefreshing(true);
    haptics.triggerLight();
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("[HomeScreen] Mock refetch completed!");
      haptics.triggerSuccess();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      haptics.triggerError();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    handleRefresh();
  }, [handleRefresh]);

  if (loading && !error) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("general.home"),
          })}
        />
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: theme.spacing[4],
            justifyContent: "center",
            backgroundColor: theme.colors.background,
          }}
          style={{ backgroundColor: theme.colors.background }}
        >
          <LoadingState message={t("general.loading")} />
        </ScrollView>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("general.home"),
          })}
        />
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: theme.spacing[4],
            justifyContent: "center",
            backgroundColor: theme.colors.background,
          }}
          style={{ backgroundColor: theme.colors.background }}
        >
          <ErrorState error={error} onRetry={handleRetry} />
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.home"),
        })}
      />
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing[4],
          backgroundColor: theme.colors.background,
          flexGrow: 1,
        }}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
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
        <View
          style={[
            theme.components.card,
            {
              alignItems: "center",
              flex: 1,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.title,
              {
                marginBottom: theme.spacing[8],
                textAlign: "center",
                fontWeight: "700",
              },
            ]}
          >
            {isAuth ? t("home.welcome_back") : t("home.welcome")}
          </Text>

          <Text
            style={[
              theme.typography.body,
              {
                marginBottom: theme.spacing[8],
                textAlign: "center",
              },
            ]}
          >
            {isAuth
              ? t("home.logged_in")
              : t("home.please_login_or_register")}
          </Text>

          <Text
            style={[
              theme.typography.caption,
              {
                marginBottom: theme.spacing[6],
                textAlign: "center",
              },
            ]}
          >
            {t("home.no_purpose_yet")}
          </Text>

          <Pressable
            style={[
              theme.components.buttonPrimary,
              {
                borderRadius: theme.borderRadius.full,
                minWidth: 200,
              },
            ]}
            onPress={() => router.push("/installation-guide" as any)}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing[2],
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[3],
              }}
            >
              <InstallIcon />
              <Text style={theme.components.buttonPrimaryText}>
                {t("home.install_app")}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

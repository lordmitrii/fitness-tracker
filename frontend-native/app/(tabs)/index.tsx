import { View, Text, Pressable, ScrollView } from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { useState, useCallback } from "react";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import InstallIcon from "@/src/icons/InstallIcon";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import PullToRefresh from "@/src/components/common/PullToRefresh";
import { LoadingState, ErrorState } from "@/src/states";

export default function HomeScreen() {
  const { isAuth } = useAuth();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleRefresh = useCallback(async () => {
    console.log("[HomeScreen] Pull-to-refresh triggered!");
    console.log("[HomeScreen] Mock refetch - simulating data refresh...");
    
    setError(null);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("[HomeScreen] Mock refetch completed!");
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
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
      <PullToRefresh
        onRefresh={handleRefresh}
        contentContainerStyle={{
          padding: theme.spacing[4],
          backgroundColor: theme.colors.background,
        }}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
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
      </PullToRefresh>
    </>
  );
}


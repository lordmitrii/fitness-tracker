import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { Stack, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { MaterialIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

import { PlatformSection } from "@/src/widgets/installation-guide";

export default function InstallationGuideScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleAppStorePress = async () => {
    const url = "https://apps.apple.com";
    await WebBrowser.openBrowserAsync(url);
  };

  const handlePlayStorePress = async () => {
    const url = "https://play.google.com";
    await WebBrowser.openBrowserAsync(url);
  };

  const iosSteps = [
    t("installation_guide.ios_steps.1") || "Open the App Store on your iPhone or iPad",
    t("installation_guide.ios_steps.2") || "Search for 'Fitness Tracker'",
    t("installation_guide.ios_steps.3") || "Tap 'Get' to download and install",
  ];

  const androidSteps = [
    t("installation_guide.android_steps.1") || "Open the Google Play Store on your Android device",
    t("installation_guide.android_steps.2") || "Search for 'Fitness Tracker'",
    t("installation_guide.android_steps.3") || "Tap 'Install' to download and install",
  ];

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("installation_guide.installation_guide") || "Installation Guide",
          headerLeft: () => (
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)/more");
                }
              }}
              style={{ paddingLeft: 16 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={theme.colors.text.primary}
              />
            </Pressable>
          ),
        })}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.card, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {t("installation_guide.installation_guide")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {t("installation_guide.steps_below") || "Follow the steps below to install the app"}
          </Text>

          <View style={styles.platformsContainer}>
            <PlatformSection
              platform="ios"
              steps={iosSteps}
              onStorePress={handleAppStorePress}
              storeButtonLabel={t("installation_guide.open_app_store") || "Open App Store"}
            />

            <PlatformSection
              platform="android"
              steps={androidSteps}
              onStorePress={handlePlayStorePress}
              storeButtonLabel={t("installation_guide.open_play_store") || "Open Play Store"}
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
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
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    textAlign: "center",
    marginBottom: theme.spacing[2],
  },
  platformsContainer: {
    gap: theme.spacing[8],
  },
});

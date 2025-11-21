import { View, Text, ScrollView, StyleSheet, Linking, Pressable } from "react-native";
import { Stack, router } from "expo-router";
import { useTranslation, Trans } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { MaterialIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

export default function InstallationGuideScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleAppStorePress = async () => {
    // TODO: Replace with actual App Store URL
    const url = "https://apps.apple.com";
    await WebBrowser.openBrowserAsync(url);
  };

  const handlePlayStorePress = async () => {
    // TODO: Replace with actual Play Store URL
    const url = "https://play.google.com";
    await WebBrowser.openBrowserAsync(url);
  };

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
            {/* iOS */}
            <View style={styles.platformSection}>
              <View style={styles.platformHeader}>
                <MaterialIcons name="phone-iphone" size={24} color={theme.colors.text.primary} />
                <Text style={[styles.platformTitle, { color: theme.colors.text.primary }]}>
                  iOS
                </Text>
              </View>
              <View style={styles.stepsContainer}>
                <View style={[styles.stepCard, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
                  <Text style={[styles.stepNumber, { color: theme.colors.button.primary.background }]}>
                    1
                  </Text>
                  <Text style={[styles.stepText, { color: theme.colors.text.primary }]}>
                    {t("installation_guide.ios_steps.1") || "Open the App Store on your iPhone or iPad"}
                  </Text>
                </View>
                <View style={[styles.stepCard, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
                  <Text style={[styles.stepNumber, { color: theme.colors.button.primary.background }]}>
                    2
                  </Text>
                  <Text style={[styles.stepText, { color: theme.colors.text.primary }]}>
                    {t("installation_guide.ios_steps.2") || "Search for 'Fitness Tracker'"}
                  </Text>
                </View>
                <View style={[styles.stepCard, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
                  <Text style={[styles.stepNumber, { color: theme.colors.button.primary.background }]}>
                    3
                  </Text>
                  <Text style={[styles.stepText, { color: theme.colors.text.primary }]}>
                    {t("installation_guide.ios_steps.3") || "Tap 'Get' to download and install"}
                  </Text>
                </View>
              </View>
              <Pressable
                style={[styles.storeButton, { backgroundColor: theme.colors.button.primary.background }]}
                onPress={handleAppStorePress}
              >
                <MaterialIcons name="store" size={20} color={theme.colors.button.primary.text} />
                <Text style={[styles.storeButtonText, { color: theme.colors.button.primary.text }]}>
                  {t("installation_guide.open_app_store") || "Open App Store"}
                </Text>
              </Pressable>
            </View>

            {/* Android */}
            <View style={styles.platformSection}>
              <View style={styles.platformHeader}>
                <MaterialIcons name="phone-android" size={24} color={theme.colors.text.primary} />
                <Text style={[styles.platformTitle, { color: theme.colors.text.primary }]}>
                  Android
                </Text>
              </View>
              <View style={styles.stepsContainer}>
                <View style={[styles.stepCard, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
                  <Text style={[styles.stepNumber, { color: theme.colors.button.primary.background }]}>
                    1
                  </Text>
                  <Text style={[styles.stepText, { color: theme.colors.text.primary }]}>
                    {t("installation_guide.android_steps.1") || "Open the Google Play Store on your Android device"}
                  </Text>
                </View>
                <View style={[styles.stepCard, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
                  <Text style={[styles.stepNumber, { color: theme.colors.button.primary.background }]}>
                    2
                  </Text>
                  <Text style={[styles.stepText, { color: theme.colors.text.primary }]}>
                    {t("installation_guide.android_steps.2") || "Search for 'Fitness Tracker'"}
                  </Text>
                </View>
                <View style={[styles.stepCard, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
                  <Text style={[styles.stepNumber, { color: theme.colors.button.primary.background }]}>
                    3
                  </Text>
                  <Text style={[styles.stepText, { color: theme.colors.text.primary }]}>
                    {t("installation_guide.android_steps.3") || "Tap 'Install' to download and install"}
                  </Text>
                </View>
              </View>
              <Pressable
                style={[styles.storeButton, { backgroundColor: theme.colors.button.primary.background }]}
                onPress={handlePlayStorePress}
              >
                <MaterialIcons name="store" size={20} color={theme.colors.button.primary.text} />
                <Text style={[styles.storeButtonText, { color: theme.colors.button.primary.text }]}>
                  {t("installation_guide.open_play_store") || "Open Play Store"}
                </Text>
              </Pressable>
            </View>
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
  platformSection: {
    gap: theme.spacing[4],
  },
  platformHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  platformTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: "600",
  },
  stepsContainer: {
    gap: theme.spacing[3],
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing[3],
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
  },
  stepNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: "bold",
    minWidth: 24,
  },
  stepText: {
    flex: 1,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.normal,
  },
  storeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[2],
    padding: theme.spacing[3.5],
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing[2],
  },
  storeButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
});

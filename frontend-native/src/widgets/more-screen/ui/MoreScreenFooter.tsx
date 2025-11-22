import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Linking } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation, Trans } from "react-i18next";
import * as WebBrowser from "expo-web-browser";

interface MoreScreenFooterProps {
  version: string;
}

export default function MoreScreenFooter({ version }: MoreScreenFooterProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const handleEmailPress = async () => {
    const email = "help.ftrackerapp@mail.com";
    const url = `mailto:${email}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const handleGitHubPress = async () => {
    const url = "https://github.com/lordmitrii";
    await WebBrowser.openBrowserAsync(url);
  };

  return (
    <>
      <View style={styles.footer}>
        <Pressable onPress={handleEmailPress}>
          <Text style={[styles.footerLink, { color: theme.colors.text.secondary }]}>
            {t("general.contact_support")}
          </Text>
        </Pressable>

        <Pressable
          style={styles.githubButton}
          onPress={handleGitHubPress}
        >
          <MaterialIcons
            name="code"
            size={20}
            color={theme.colors.text.secondary}
          />
        </Pressable>
      </View>

      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.colors.text.tertiary }]}>
          {t("general.version")}: {version || t("general.n_a")}
        </Text>
      </View>

      <View style={styles.policiesContainer}>
        <Trans
          i18nKey="general.our_policies"
          parent={Text}
          style={[styles.policiesText, { color: theme.colors.text.secondary }]}
          components={[
            <Text
              key="privacy-policy-link"
              onPress={() => router.push("/(policies)/privacy-policy")}
              style={[styles.policyLink, { color: theme.colors.button.primary.background }]}
            >
              {t("privacy_policy.title")}
            </Text>,
            <Text
              key="health-data-policy-link"
              onPress={() => router.push("/(policies)/health-data-policy")}
              style={[styles.policyLink, { color: theme.colors.button.primary.background }]}
            >
              {t("health_data_policy.title")}
            </Text>,
          ]}
        />
      </View>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[3],
  },
  footerLink: {
    fontSize: theme.fontSize.base,
    textDecorationLine: "underline",
  },
  githubButton: {
    padding: theme.spacing[1],
  },
  versionContainer: {
    alignItems: "center",
  },
  versionText: {
    fontSize: theme.fontSize.sm,
  },
  policiesContainer: {
    alignItems: "center",
  },
  policiesText: {
    fontSize: theme.fontSize.sm,
    textAlign: "center",
    lineHeight: 18,
  },
  policyLink: {
    fontSize: theme.fontSize.sm,
    textDecorationLine: "underline",
  },
});


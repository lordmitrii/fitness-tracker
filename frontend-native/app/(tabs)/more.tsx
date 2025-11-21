import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation, Trans } from "react-i18next";
import { router, Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { useAuth } from "@/src/context/AuthContext";
import LanguageSwitcher from "@/src/components/LanguageSwitcher";
import useVersionsData from "@/src/hooks/data/userVersionsData";
import * as WebBrowser from "expo-web-browser";

export default function MoreScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { isAuth, hasAnyRole, logout } = useAuth();
  const { getVersion } = useVersionsData();
  const styles = createStyles(theme);

  const links = [
    { to: "/(tabs)", label: t("general.home"), auth: null, roles: [] },
    {
      to: "/(admin)",
      label: t("general.admin_panel"),
      auth: true,
      roles: ["admin"],
    },
    {
      to: "/(tabs)/workout-plans",
      label: t("general.workout_plans"),
      auth: true,
      roles: [],
    },
    {
      to: "/ai-chat",
      label: t("general.ai_chat"),
      auth: true,
      roles: ["admin", "member"],
      isNew: true,
    },
    { to: "/(tabs)/profile", label: t("general.profile"), auth: true, roles: [] },
    { to: "/settings", label: t("general.settings"), auth: true, roles: [] },
    { to: "/(auth)/login", label: t("general.login"), auth: false, roles: [] },
    {
      to: "/(auth)/register",
      label: t("general.register"),
      auth: false,
      roles: [],
      isPrimary: true,
    },
  ];

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  const handleLinkPress = (to: string) => {
    router.push(to as any);
  };

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

  const filteredLinks = links.filter(
    (l) => l.auth === null || l.auth === isAuth
  ).filter((l) => !l.roles.length || hasAnyRole(l.roles));

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.more") || "More",
        })}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Fitness Tracker
          </Text>
          <View style={styles.headerActions}>
            <LanguageSwitcher />
          </View>
        </View>

        <View style={styles.linksContainer}>
          {filteredLinks.map((link) => (
            <Pressable
              key={link.to}
              style={[
                styles.linkButton,
                link.isPrimary && styles.primaryLinkButton,
                {
                  backgroundColor: link.isPrimary
                    ? theme.colors.button.primary.background
                    : theme.colors.card.background,
                  borderColor: link.isPrimary
                    ? theme.colors.button.primary.background
                    : theme.colors.border,
                },
              ]}
              onPress={() => handleLinkPress(link.to)}
            >
              <Text
                style={[
                  styles.linkText,
                  {
                    color: link.isPrimary
                      ? theme.colors.button.primary.text
                      : theme.colors.text.primary,
                  },
                ]}
              >
                {link.label}
              </Text>
              {link.isNew && (
                <View
                  style={[
                    styles.newBadge,
                    {
                      backgroundColor: theme.colors.status.success.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.newBadgeText,
                      { color: theme.colors.status.success.text },
                    ]}
                  >
                    NEW
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {isAuth && (
          <Pressable
            style={[
              styles.logoutButton,
              {
                backgroundColor: theme.colors.status.error.background,
              },
            ]}
            onPress={handleLogout}
          >
            <Text
              style={[
                styles.logoutButtonText,
                { color: theme.colors.status.error.text },
              ]}
            >
              {t("general.logout")}
            </Text>
          </Pressable>
        )}

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
            {t("general.version")}: {getVersion("app") ? getVersion("app") : t("general.n_a")}
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
    gap: theme.spacing[6],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    gap: theme.spacing[2],
  },
  linksContainer: {
    gap: theme.spacing[3],
  },
  linkButton: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryLinkButton: {
    borderWidth: 0,
  },
  linkText: {
    fontSize: theme.fontSize.md,
    fontWeight: "500",
  },
  newBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.xl,
  },
  newBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: "700",
  },
  logoutButton: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
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

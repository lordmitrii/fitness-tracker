import { View, ScrollView, StyleSheet } from "react-native";
import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { useAuth } from "@/src/shared/lib/context/AuthContext";
import { useVersions } from "@/src/entities/version";

import {
  MoreScreenHeader,
  NavigationLinks,
  MoreScreenFooter,
  LogoutButton,
} from "@/src/widgets/more-screen";
import { useNavigationLinks } from "@/src/features/more/navigation-links";

export default function MoreScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { isAuth, logout } = useAuth();
  const { getVersion } = useVersions();
  const { links } = useNavigationLinks();
  const styles = createStyles(theme);

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  const handleLinkPress = (to: string) => {
    router.push(to as any);
  };

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
        <MoreScreenHeader />

        <NavigationLinks links={links} onLinkPress={handleLinkPress} />

        {isAuth && <LogoutButton onLogout={handleLogout} />}

        <MoreScreenFooter version={getVersion("app")} />
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
});

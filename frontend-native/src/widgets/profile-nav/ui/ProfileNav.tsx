import { View, Pressable, Text, StyleSheet } from "react-native";
import { usePathname, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

const PROFILE_TABS = [
  {
    key: "health",
    labelKey: "profile.nav.health",
    href: "/(tabs)/profile/health",
    matchPrefix: "/(tabs)/profile/health",
  },
  {
    key: "stats",
    labelKey: "profile.nav.stats",
    href: "/(tabs)/profile/stats",
    matchPrefix: "/(tabs)/profile/stats",
  },
];

export default function ProfileNav() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {PROFILE_TABS.map((tab) => {
        const active =
          typeof pathname === "string" &&
          pathname.startsWith(tab.matchPrefix);
        return (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              {
                backgroundColor: active
                  ? theme.colors.button.primary.background
                  : theme.colors.card.background,
                borderColor: active
                  ? theme.colors.button.primary.background
                  : theme.colors.border,
              },
            ]}
            onPress={() => {
              if (!active) {
                router.replace(tab.href as any);
              }
            }}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: active
                    ? theme.colors.button.primary.text
                    : theme.colors.text.primary,
                },
              ]}
            >
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});


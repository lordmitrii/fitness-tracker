import { Tabs, usePathname } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { HapticTab } from "@/src/components/haptic-tab";
import { Platform, Text } from "react-native";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { useTranslation } from "react-i18next";
import { useRouteGuard } from "@/src/hooks/auth/useRouteGuard";

type TabConfig = {
  name: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  translationKey: string;
};

const TAB_CONFIGS: TabConfig[] = [
  { name: "index", iconName: "home", translationKey: "general.home" },
  {
    name: "workout-plans",
    iconName: "fitness-center",
    translationKey: "general.plans",
  },
  {
    name: "current-workout",
    iconName: "directions-run",
    translationKey: "general.workout",
  },
  { name: "profile", iconName: "person", translationKey: "general.profile" },
  { name: "more", iconName: "more-horiz", translationKey: "general.more" },
];

const HIDDEN_ROUTES = [
  "workout-plans/[planID]",
  "workout-plans/create-workout-plan",
  "workout-plans/update-workout-plan/[planID]",
  "workout-plans/[planID]/workout-cycles/[cycleID]",
  "workout-plans/[planID]/workout-cycles/[cycleID]/create-workout",
  "workout-plans/[planID]/workout-cycles/[cycleID]/update-workout/[workoutID]",
  "profile/health",
  "profile/stats",
  "profile/health/create-profile",
  "profile/health/update-profile",
];

export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const guard = useRouteGuard({
    requireAuth: true,
    restrictedRoles: ["restricted"],
    redirectRestrictedTo: "/(auth)/account-verification",
  });

  const headerOptions = createHeaderOptions(theme, {
    headerShown: true,
  });

  const tabHeaderOptions = {
    headerShown: headerOptions.headerShown,
    headerTitle: headerOptions.headerTitle,
    headerTitleStyle: headerOptions.headerTitleStyle,
    headerTintColor: headerOptions.headerTintColor,
    headerStyle: headerOptions.headerStyle,
    headerRight: headerOptions.headerRight,
    headerLeft: headerOptions.headerLeft,
    headerStatusBarHeight: headerOptions.headerStatusBarHeight,
  };

  const isTabActive = (tabName: string): boolean => {
    if (tabName === "workout-plans") {
      const exactMatch =
        pathname === `/(tabs)/workout-plans` || pathname === `/workout-plans`;
      const planDetailMatch = pathname.match(
        /^\/\(tabs\)\/workout-plans\/\[planID\]$/
      );
      const isCyclePage = pathname.includes("/workout-cycles/");
      return Boolean((exactMatch || planDetailMatch) && !isCyclePage);
    }

    if (tabName === "current-workout") {
      return pathname.includes("/workout-cycles/");
    }

    const exactMatch =
      pathname === `/(tabs)/${tabName}` || pathname === `/${tabName}`;
    const nestedMatch =
      pathname.startsWith(`/(tabs)/${tabName}/`) ||
      pathname.startsWith(`/${tabName}/`);
    return Boolean(exactMatch || nestedMatch);
  };

  const getTabColor = (isActive: boolean) =>
    isActive
      ? theme.colors.button.primary.background
      : theme.colors.text.tertiary;

  const createTabIcon = (
    iconName: keyof typeof MaterialIcons.glyphMap,
    tabName: string
  ) => {
    return ({ focused, size }: { focused: boolean; size: number }) => {
      const isActive = focused || isTabActive(tabName);
      const iconColor = getTabColor(isActive);
      return <MaterialIcons name={iconName} size={size} color={iconColor} />;
    };
  };

  const createTabLabel = (translationKey: string, tabName: string) => {
    return ({ focused }: { focused: boolean }) => {
      const isActive = focused || isTabActive(tabName);
      const labelColor = getTabColor(isActive);
      return (
        <Text
          style={{
            color: labelColor,
            fontSize: theme.fontSize.sm,
            fontWeight: "500",
          }}
        >
          {t(translationKey)}
        </Text>
      );
    };
  };

  if (guard.state !== "allowed") {
    return guard.element;
  }

  return (
    <Tabs
      screenOptions={{
        ...tabHeaderOptions,
        tabBarActiveTintColor: theme.colors.button.primary.background,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.card.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingTop: Platform.OS === "ios" ? 8 : 4,
          paddingBottom: Platform.OS === "ios" ? 10 : 8,
          height: Platform.OS === "ios" ? 64 : 64,
        },
        tabBarLabelStyle: {
          fontSize: theme.fontSize.sm,
          fontWeight: "500",
        },
        tabBarIconStyle: {
          marginTop: theme.spacing[1],
        },
        tabBarItemStyle: {
          paddingHorizontal: 5, // Keep as is - specific tab bar spacing
          marginTop: -5,
        },
      }}
    >
      {TAB_CONFIGS.map(({ name, iconName, translationKey }) => {
        const title = t(translationKey);
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title,
              headerTitle: title,
              tabBarLabel: createTabLabel(translationKey, name),
              tabBarIcon: createTabIcon(iconName, name),
              tabBarButton: HapticTab,
            }}
          />
        );
      })}

      {HIDDEN_ROUTES.map((route) => (
        <Tabs.Screen key={route} name={route} options={{ href: null }} />
      ))}
    </Tabs>
  );
}

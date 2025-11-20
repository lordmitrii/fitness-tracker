import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import { HapticTab } from "@/src/components/haptic-tab";
import { Platform } from "react-native";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { theme } = useTheme();
  const { isAuth } = useAuth();
  const { t } = useTranslation();

  const headerOptions = createHeaderOptions(theme, {
    headerShown: true,
  });

  return (
    <Tabs
      screenOptions={{
        ...headerOptions,
        tabBarActiveTintColor: theme.colors.button.primary.background,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.card.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingTop: Platform.OS === "ios" ? 8 : 4,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          height: Platform.OS === "ios" ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("general.home"),
          headerTitle: t("general.home"),
          tabBarLabel: t("general.home"),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
          tabBarButton: HapticTab,
        }}
      />
      
      <Tabs.Screen
        name="workout-plans"
        options={{
          title: t("general.plans"),
          headerTitle: t("general.plans"),
          tabBarLabel: t("general.plans"),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="fitness-center" size={size} color={color} />
          ),
          tabBarButton: HapticTab,
        }}
      />
      
      <Tabs.Screen
        name="current-workout"
        options={{
          title: t("general.workout"),
          headerTitle: t("general.workout"),
          tabBarLabel: t("general.workout"),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="directions-run" size={size} color={color} />
          ),
          tabBarButton: HapticTab,
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: t("general.profile"),
          headerTitle: t("general.profile"),
          tabBarLabel: t("general.profile"),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
          tabBarButton: HapticTab,
        }}
      />
      
      <Tabs.Screen
        name="more"
        options={{
          title: t("general.more"),
          headerTitle: t("general.more"),
          tabBarLabel: t("general.more"),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="more-horiz" size={size} color={color} />
          ),
          tabBarButton: HapticTab,
        }}
      />

      <Tabs.Screen
        name="workout-plans/[planID]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="workout-plans/create-workout-plan"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="workout-plans/update-workout-plan/[planID]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="workout-plans/[planID]/workout-cycles/[cycleID]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="workout-plans/[planID]/workout-cycles/[cycleID]/create-workout"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="workout-plans/[planID]/workout-cycles/[cycleID]/update-workout/[workoutID]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/health"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/stats"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/health/create-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/health/update-profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}


import { View, Text, ScrollView, Pressable } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { router, Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { createHeaderOptions } from "@/src/navigation/headerConfig";

export default function MoreScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const menuItems = [
    {
      label: t("general.settings") || "Settings",
      icon: "settings",
      onPress: () => router.push("/settings" as any),
    },
    {
      label: t("general.language") || "Language",
      icon: "language",
      onPress: () => router.push("/language" as any),
    },
  ];

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.more"),
        })}
      />
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
        }}
        contentContainerStyle={{
          padding: theme.spacing[4],
        }}
      >
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            onPress={item.onPress}
            style={[
              theme.components.card,
              {
                flexDirection: "row",
                alignItems: "center",
                marginBottom: theme.spacing[4],
                padding: theme.spacing[4],
              },
            ]}
          >
            <MaterialIcons
              name={item.icon as any}
              size={24}
              color={theme.colors.text.primary}
              style={{ marginRight: theme.spacing[3] }}
            />
            <Text style={theme.typography.body}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}


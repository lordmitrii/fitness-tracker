import { View, Text } from "react-native";
import { Link, Stack } from "expo-router";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.not_found") || "Not Found",
        })}
      />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: theme.spacing[4],
        }}
      >
        <Text
          style={[
            theme.typography.title,
            {
              marginBottom: theme.spacing[4],
              textAlign: "center",
            },
          ]}
        >
          404
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
          {t("general.page_not_found") || "Page not found"}
        </Text>
        <Link href="/" asChild>
          <Text
            style={[
              theme.typography.body,
              {
                color: theme.colors.button.primary.background,
                textDecorationLine: "underline",
              },
            ]}
          >
            {t("general.go_home") || "Go Home"}
          </Text>
        </Link>
      </View>
    </>
  );
}


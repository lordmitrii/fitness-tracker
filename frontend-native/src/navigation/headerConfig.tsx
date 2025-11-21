import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Platform, Text } from "react-native";
import { Theme } from "@/src/themes";
import { ReactNode } from "react";

export interface HeaderConfigOptions {
  title?: string;
  headerTitle?: string | ((props: any) => ReactNode);
  headerRight?: (props: any) => ReactNode;
  headerLeft?: (props: any) => ReactNode;
  headerBackTitle?: string;
  headerBackTitleVisible?: boolean;
  presentation?: "card" | "modal" | "transparentModal" | "containedModal" | "fullScreenModal" | "formSheet";
  headerShown?: boolean;
  headerTransparent?: boolean;
  headerBlurEffect?: "light" | "dark" | "extraLight" | "regular" | "prominent" | "systemUltraThinMaterial" | "systemThinMaterial" | "systemMaterial" | "systemThickMaterial" | "systemChromeMaterial";
  headerStyle?: object;
  headerTitleStyle?: object;
  headerTintColor?: string;
  headerShadowVisible?: boolean;
}

export const createHeaderOptions = (
  theme: Theme,
  options: HeaderConfigOptions = {}
): NativeStackNavigationOptions => {
  const {
    title,
    headerTitle,
    headerRight,
    headerLeft,
    headerBackTitle,
    headerBackTitleVisible = false,
    presentation,
    headerShown = true,
    headerTransparent = false,
    headerBlurEffect,
    headerStyle,
    headerTitleStyle,
    headerTintColor,
    headerShadowVisible = true,
  } = options;

  return {
    headerShown,
    title: title || undefined,
    headerTitle: headerTitle || title || undefined,
    headerRight,
    headerLeft,
    headerBackTitle: Platform.OS === "ios" ? headerBackTitle : undefined,
    presentation,
    headerTransparent,
    headerBlurEffect: Platform.OS === "ios" ? headerBlurEffect : undefined,
    headerStyle: {
      backgroundColor: headerTransparent ? "transparent" : theme.colors.card.background,
      ...headerStyle,
    } as any,
    headerTitleStyle: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: theme.colors.text.primary,
      ...headerTitleStyle,
    },
    headerTintColor: headerTintColor || theme.colors.text.primary,
    headerBackTitleStyle: {
      fontSize: 17,
    },
    headerTitleAlign: "center" as const,
  };
};

export const createHeaderTitle = (
  title: string,
  theme: Theme,
  style?: object
): ((props: any) => ReactNode) => {
  return ({ children, ...props }) => {
    return (
      <Text
        style={[
          {
            fontSize: 18,
            fontWeight: "600",
            color: theme.colors.text.primary,
          },
          style,
        ]}
        {...props}
      >
        {title}
      </Text>
    );
  };
};


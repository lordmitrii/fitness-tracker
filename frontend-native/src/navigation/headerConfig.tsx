import { StackNavigationOptions } from "@react-navigation/stack";
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
): StackNavigationOptions => {
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
    headerBackTitleVisible: Platform.OS === "ios" ? headerBackTitleVisible : false,
    presentation,
    headerTransparent,
    headerBlurEffect: Platform.OS === "ios" ? headerBlurEffect : undefined,
    headerStyle: {
      backgroundColor: headerTransparent ? "transparent" : theme.colors.card.background,
      borderBottomWidth: headerShadowVisible ? 1 : 0,
      borderBottomColor: theme.colors.border,
      elevation: headerShadowVisible && Platform.OS === "android" ? 2 : 0,
      shadowOpacity: headerShadowVisible && Platform.OS === "ios" ? 0.1 : 0,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      ...headerStyle,
    },
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


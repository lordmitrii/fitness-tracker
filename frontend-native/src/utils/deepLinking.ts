import * as Linking from "expo-linking";
import { router } from "expo-router";

export interface DeepLinkConfig {
  scheme: string;
  host?: string;
}

export function configureDeepLinking(config: DeepLinkConfig) {
  const prefix = Linking.createURL("/", { scheme: config.scheme });
  return {
    prefixes: [prefix],
    config: {
      screens: {
        "(tabs)": {
          screens: {
            index: "",
            "workout-plans": "workout-plans",
            "current-workout": "current-workout",
            profile: "profile",
            more: "more",
          },
        },
        "(auth)": {
          screens: {
            login: "login",
            register: "register",
          },
        },
        settings: "settings",
        "ai-chat": "ai-chat",
      },
    },
  };
}

export async function handleDeepLink(url: string) {
  const { path, queryParams } = Linking.parse(url);

  if (!path) return;

  const routeMap: Record<string, string> = {
    "workout-plans": "/(tabs)/workout-plans",
    "current-workout": "/(tabs)/current-workout",
    profile: "/(tabs)/profile",
    settings: "/settings",
    "ai-chat": "/ai-chat",
    login: "/(auth)/login",
    register: "/(auth)/register",
  };

  const route = routeMap[path] || path;

  if (queryParams) {
    router.push({
      pathname: route as any,
      params: queryParams as any,
    });
  } else {
    router.push(route as any);
  }
}

export function generateDeepLink(
  path: string,
  params?: Record<string, string | number>
): string {
  const baseUrl = Linking.createURL(path);
  if (!params) return baseUrl;

  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return `${baseUrl}?${queryString}`;
}

export async function shareDeepLink(
  path: string,
  params?: Record<string, string | number>
) {
  const url = generateDeepLink(path, params);
  const { shareText } = await import("./shareContent");
  return shareText(url, "Share Link");
}



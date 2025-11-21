import { ReactNode, useMemo } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";

export type RouteGuardOptions = {
  requireAuth?: boolean;
  guestOnly?: boolean;
  requiredRoles?: string[];
  restrictedRoles?: string[];
  redirectUnauthenticatedTo?: string;
  redirectAuthenticatedTo?: string;
  redirectRestrictedTo?: string;
  redirectInsufficientRoleTo?: string;
  loadingFallback?: ReactNode;
};

type GuardAllowed = { state: "allowed"; element?: undefined };
type GuardBlocked = { state: "loading" | "redirect"; element: ReactNode };

export type RouteGuardResult = GuardAllowed | GuardBlocked;

/**
 * Consolidates legacy PrivateRoute/GuestRoute/AdminRoute logic so layouts
 * can focus on rendering stacks/tabs.
 */
export function useRouteGuard(options: RouteGuardOptions = {}): RouteGuardResult {
  const {
    requireAuth = false,
    guestOnly = false,
    requiredRoles = [],
    restrictedRoles = [],
    redirectUnauthenticatedTo = "/(auth)/login",
    redirectAuthenticatedTo = "/(tabs)",
    redirectRestrictedTo = "/(auth)/account-verification",
    redirectInsufficientRoleTo = "/(tabs)",
    loadingFallback,
  } = options;

  const { theme } = useTheme();
  const { isAuth, loading, hasRole } = useAuth();
  const colors = theme.colors;

  const defaultLoader = useMemo(
    () => (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator
          size="large"
          color={colors.button.primary.background}
        />
      </View>
    ),
    [colors.background, colors.button.primary.background]
  );

  if (loading) {
    return { state: "loading", element: loadingFallback ?? defaultLoader };
  }

  if (requireAuth && !isAuth) {
    return { state: "redirect", element: <Redirect href={redirectUnauthenticatedTo as any} /> };
  }

  if (guestOnly && isAuth) {
    return { state: "redirect", element: <Redirect href={redirectAuthenticatedTo as any} /> };
  }

  if (restrictedRoles.length > 0 && restrictedRoles.some((role) => hasRole(role))) {
    return { state: "redirect", element: <Redirect href={redirectRestrictedTo as any} /> };
  }

  if (requiredRoles.length > 0 && !requiredRoles.every((role) => hasRole(role))) {
    return { state: "redirect", element: <Redirect href={redirectInsufficientRoleTo as any} /> };
  }

  return { state: "allowed" };
}


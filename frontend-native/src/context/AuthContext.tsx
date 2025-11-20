import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import api, {
  loginRequest,
  registerRequest,
  setAccessToken,
  clearAccessToken,
} from "@/src/api";
import { useTranslation } from "react-i18next";
import useStorageObject from "@/src/hooks/useStorageObject";

// Types
export interface Role {
  name: string;
  [key: string]: unknown;
}

export interface User {
  id?: string | number;
  username?: string;
  email?: string;
  roles?: Role[];
  [key: string]: unknown;
}

interface AuthSnapshot {
  user: User | null;
  roles: Role[];
  isAuth: boolean;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  isAuth: boolean;
  user: User | null;
  roles: Role[];
  loading: boolean;
  isRefreshing: boolean;
  status: AuthStatus;
  login: (username: string, password: string) => Promise<{ message?: string; data?: unknown }>;
  register: (
    username: string,
    email: string,
    password: string,
    privacyConsent: boolean,
    privacyPolicyVersion: string,
    healthDataConsent: boolean,
    healthDataPolicyVersion: string
  ) => Promise<{ message?: string; data?: unknown }>;
  logout: () => void;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (list: string[]) => boolean;
  refresh: () => Promise<"authenticated" | "unauthenticated" | "offline">;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { t } = useTranslation();

  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [
    authSnap,
    setAuthSnap,
    { clear: clearAuthSnap, restoring: snapRestoring },
  ] = useStorageObject<AuthSnapshot>(
    "auth:last-snapshot",
    {
      user: null,
      roles: [],
      isAuth: false,
    }
  );

  const refreshInFlightRef = useRef<Promise<"authenticated" | "unauthenticated" | "offline"> | null>(null);
  const lastAuthRef = useRef<AuthSnapshot>(authSnap);
  const hydratedRef = useRef(false);

  useEffect(() => {
    lastAuthRef.current = authSnap;
  }, [authSnap]);

  const loadMe = useCallback(async () => {
    const res = await api.get("/users/me");
    const next: AuthSnapshot = {
      user: res.data,
      roles: res.data.roles || [],
      isAuth: true,
    };
    setUser(next.user);
    setRoles(next.roles);
    lastAuthRef.current = next;
    setAuthSnap(next);
  }, [setAuthSnap]);

  const refresh = useCallback(async (): Promise<"authenticated" | "unauthenticated" | "offline"> => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    setLoading(true);
    const p = (async () => {
      try {
        const res = await api.post("/users/refresh");
        if (res.data?.access_token) {
          setAccessToken(res.data.access_token);
          setIsAuth(true);
          await loadMe();
          return "authenticated";
        }
        clearAccessToken();
        setIsAuth(false);
        setRoles([]);
        setUser(null);
        const next: AuthSnapshot = { user: null, roles: [], isAuth: false };
        lastAuthRef.current = next;
        setAuthSnap(next);
        return "unauthenticated";
      } catch (error: unknown) {
        console.error("Refresh error:", error);
        const err = error as { isOffline?: boolean };
        if (err?.isOffline) {
          setIsAuth(!!lastAuthRef.current.isAuth);
          setRoles(lastAuthRef.current.roles || []);
          setUser(lastAuthRef.current.user || null);
          return "offline";
        }
        clearAccessToken();
        setIsAuth(false);
        setRoles([]);
        setUser(null);
        const next: AuthSnapshot = { user: null, roles: [], isAuth: false };
        lastAuthRef.current = next;
        setAuthSnap(next);
        return "unauthenticated";
      } finally {
        setLoading(false);
      }
    })();

    refreshInFlightRef.current = p;
    p.finally(() => {
      if (refreshInFlightRef.current === p) refreshInFlightRef.current = null;
    });
    return p;
  }, [loadMe, setAuthSnap]);

  useEffect(() => {
    if (hydratedRef.current || snapRestoring) return;

    setIsAuth(!!authSnap.isAuth);
    setUser(authSnap.user || null);
    setRoles(authSnap.roles || []);
    setLoading(false);

    hydratedRef.current = true;
    refresh();
  }, [authSnap, snapRestoring, refresh]);

  // Listen to network changes and app state changes
  useEffect(() => {
    const handleNetworkChange = (state: NetInfoState) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      if (isConnected) {
        refresh();
      }
    };

    const unsubscribeNetInfo = NetInfo.addEventListener(handleNetworkChange);

    // Also refresh when app comes to foreground
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        refresh();
      }
    });

    return () => {
      unsubscribeNetInfo();
      subscription.remove();
    };
  }, [refresh]);

  const login = async (username: string, password: string): Promise<{ message?: string; data?: unknown }> => {
    try {
      const response = await loginRequest(username, password);
      if (response?.data?.access_token) {
        setAccessToken(response.data.access_token);
        setIsAuth(true);
        await loadMe();
      }
      return response;
    } catch (error: unknown) {
      const err = error as { response?: unknown; isOffline?: boolean };
      if (!err.response || err.isOffline)
        return { message: t("errors.network_error") };
      console.error("Login error:", error);
      return { message: t("errors.login_error") };
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    privacyConsent: boolean,
    privacyPolicyVersion: string,
    healthDataConsent: boolean,
    healthDataPolicyVersion: string
  ): Promise<{ message?: string; data?: unknown }> => {
    try {
      const response = await registerRequest(
        username,
        email,
        password,
        privacyConsent,
        privacyPolicyVersion,
        healthDataConsent,
        healthDataPolicyVersion
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: unknown; isOffline?: boolean };
      if (!err.response || err.isOffline)
        return { message: t("errors.network_error") };
      console.error("Registration error:", error);
      return { message: t("errors.registration_error") };
    }
  };

  const logout = () => {
    setIsAuth(false);
    clearAccessToken();
    setRoles([]);
    setUser(null);
    try {
      api.post("/users/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }
    const next: AuthSnapshot = { user: null, roles: [], isAuth: false };
    lastAuthRef.current = next;
    clearAuthSnap();
  };

  const hasRole = (roleName: string): boolean => roles.some((r) => r.name === roleName);
  const hasAnyRole = (list: string[]): boolean =>
    list.some((role) => roles.some((r) => r.name === role));

  const status: AuthStatus = loading
    ? "loading"
    : isAuth
    ? "authenticated"
    : "unauthenticated";
  const isRefreshing = !!refreshInFlightRef.current;

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        user,
        roles,
        loading,
        isRefreshing,
        status,
        login,
        register,
        logout,
        hasRole,
        hasAnyRole,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};


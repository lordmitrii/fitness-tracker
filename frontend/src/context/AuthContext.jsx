import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import api, {
  loginRequest,
  registerRequest,
  setAccessToken,
  clearAccessToken,
} from "../api";
import { useTranslation } from "react-i18next";
import useStorageObject from "../hooks/useStorageObject";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();

  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [user, setUser] = useState(null);

  const [
    authSnap,
    setAuthSnap,
    { clear: clearAuthSnap, restoring: snapRestoring },
  ] = useStorageObject(
    "auth:last-snapshot",
    {
      user: null,
      roles: [],
      isAuth: false,
    },
    localStorage
  );

  const refreshInFlightRef = useRef(null);
  const lastAuthRef = useRef(authSnap);
  const hydratedRef = useRef(false);

  useEffect(() => {
    lastAuthRef.current = authSnap;
  }, [authSnap]);

  const loadMe = useCallback(async () => {
    const res = await api.get("/users/me");
    const next = {
      user: res.data,
      roles: res.data.roles || [],
      isAuth: true,
    };
    setUser(next.user);
    setRoles(next.roles);
    lastAuthRef.current = next;
    setAuthSnap(next);
  }, [setAuthSnap]);

  const refresh = useCallback(async () => {
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
        const next = { user: null, roles: [], isAuth: false };
        lastAuthRef.current = next;
        setAuthSnap(next);
        return "unauthenticated";
      } catch (error) {
        console.error("Refresh error:", error);
        if (error?.isOffline) {
          setIsAuth(!!lastAuthRef.current.isAuth);
          setRoles(lastAuthRef.current.roles || []);
          setUser(lastAuthRef.current.user || null);
          return "offline";
        }
        clearAccessToken();
        setIsAuth(false);
        setRoles([]);
        setUser(null);
        const next = { user: null, roles: [], isAuth: false };
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

  useEffect(() => {
    const onOnline = () => refresh();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [refresh]);

  const login = async (username, password) => {
    try {
      const response = await loginRequest(username, password);
      if (response?.data?.access_token) {
        setAccessToken(response.data.access_token);
        setIsAuth(true);
        await loadMe();
      }
      return response;
    } catch (error) {
      if (!error.response || error.isOffline)
        return { message: t("errors.network_error") };
      console.error("Login error:", error);
      return { message: t("errors.login_error") };
    }
  };

  const register = async (
    username,
    email,
    password,
    privacyConsent,
    privacyPolicyVersion,
    healthDataConsent,
    healthDataPolicyVersion,
  ) => {
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
    } catch (error) {
      if (!error.response || error.isOffline)
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
    const next = { user: null, roles: [], isAuth: false };
    lastAuthRef.current = next;
    clearAuthSnap();
  };

  const hasRole = (roleName) => roles.some((r) => r.name === roleName);
  const hasAnyRole = (list) =>
    list.some((role) => roles.some((r) => r.name === role));

  const status = loading
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

export const useAuth = () => useContext(AuthContext);

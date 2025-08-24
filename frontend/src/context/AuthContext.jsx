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

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [user, setUser] = useState(null);

  const refreshInFlightRef = useRef(null);
  const lastAuthRef = useRef({
    user: null,
    roles: [],
    isAuth: false,
  });

  const loadMe = useCallback(async () => {
    const res = await api.get("/users/me");
    setUser(res.data);
    setRoles(res.data.roles || []);
    lastAuthRef.current = {
      user: res.data,
      roles: res.data.roles || [],
      isAuth: true,
    };
  }, []);

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
        lastAuthRef.current = {
          user: null,
          roles: [],
          isAuth: false,
        };
        return "unauthenticated";
      } catch (error) {
        console.error("Refresh error:", error);
        if (error?.isOffline) {
          setIsAuth(lastAuthRef.current.isAuth);
          setRoles(lastAuthRef.current.roles);
          setUser(lastAuthRef.current.user);
          return "offline";
        }
        clearAccessToken();
        setIsAuth(false);
        setRoles([]);
        setUser(null);
        lastAuthRef.current = {
          user: null,
          roles: [],
          isAuth: false,
        };
        return "unauthenticated";
      } finally {
        setLoading(false);
      }
    })();

    refreshInFlightRef.current = p;

    p.finally(() => {
      if (refreshInFlightRef.current === p) {
        refreshInFlightRef.current = null;
      }
    });

    return p;
  }, [loadMe]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onOnline = () => refresh();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [refresh]);

  const login = async (email, password) => {
    try {
      const { data } = await loginRequest(email, password);
      if (data && data.access_token) {
        setAccessToken(data.access_token);
        setIsAuth(true);
        await loadMe();
      }
      return data;
    } catch (error) {
      if (!error.response || error.isOffline)
        return { message: t("errors.network_error") };
      console.error("Login error:", error);
      return { message: t("errors.login_error") };
    }
  };

  const register = async (
    email,
    password,
    privacyConsent,
    privacyPolicyVersion,
    healthDataConsent,
    healthDataPolicyVersion
  ) => {
    try {
      const response = await registerRequest(
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
    lastAuthRef.current = { user: null, roles: [], isAuth: false };
    // Optionally, send a logout endpoint to clear cookie on backend
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

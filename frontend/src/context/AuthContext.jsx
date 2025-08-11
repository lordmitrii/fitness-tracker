import { createContext, useState, useContext, useEffect } from "react";
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

  const loadMe = async () => {
    const res = await api.get("/users/me");
    setUser(res.data);
    setRoles(res.data.roles || []);
  };

  useEffect(() => {
    const tryRefresh = async () => {
      setLoading(true);
      try {
        const res = await api.post("/users/refresh");
        if (res.data.access_token) {
          setIsAuth(true);
          setAccessToken(res.data.access_token);
          await loadMe();
        }
      } catch (err) {
        console.error("Refresh error:", err);
        setIsAuth(false);
        clearAccessToken();
        setRoles([]);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    tryRefresh();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await loginRequest(email, password);
      const data = response.data;
      if (data.access_token) {
        setIsAuth(true);
        setAccessToken(data.access_token);
        await loadMe();
      }
      return data;
    } catch (error) {
      if (!error.response) return { message: t("errors.network_error") };

      console.error("Login error:", error);
      return {
        message: t("errors.login_error"),
      };
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
      if (!error.response) return { message: t("errors.network_error") };

      console.error("Registration error:", error);
      return {
        message: t("errors.registration_error"),
      };
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
    // Optionally, send a logout endpoint to clear cookie on backend
  };

  const hasRole = (roleName) => roles.some((role) => role.name === roleName);

  const hasAnyRole = (roleList) =>
    roleList.some((role) => roles.some((r) => r.name === role));

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        user,
        roles,
        loading,
        login,
        register,
        logout,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

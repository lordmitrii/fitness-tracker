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

  useEffect(() => {
    const tryRefresh = async () => {
      setLoading(true);
      try {
        const res = await api.post("/users/refresh");
        if (res.data.access_token) {
          setIsAuth(true);
          setAccessToken(res.data.access_token);
        }
      } catch (err) {
        setIsAuth(false);
        clearAccessToken();
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

  const register = async (email, password) => {
    try {
      const response = await registerRequest(email, password);
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
    try {
      api.post("/users/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }
    // Optionally, send a logout endpoint to clear cookie on backend
  };

  return (
    <AuthContext.Provider value={{ isAuth, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

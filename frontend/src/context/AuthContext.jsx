import { createContext, useState, useContext, useEffect } from "react";
import api, { loginRequest, registerRequest, setAccessToken, clearAccessToken } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const tryRefresh = async () => {
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
      return { message: error.response?.data?.message || "Login failed" };
    }
  };

  const register = async (email, password) => {
    try {
      const response = await registerRequest(email, password);
      return response.data;
    } catch (error) {
      return {
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    setIsAuth(false);
    clearAccessToken();
    // Optionally, send a logout endpoint to clear cookie on backend
  };

  return (
    <AuthContext.Provider value={{ isAuth, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

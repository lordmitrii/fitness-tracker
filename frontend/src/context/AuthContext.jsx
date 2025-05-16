import { createContext, useState, useContext } from 'react';
import { loginRequest, registerRequest } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (email, password) => {
    try {
      const response = await loginRequest(email, password);
      const data = response.data;
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
      }
      return data;
    } catch (error) {
      return { message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (email, password) => {
    try {
      const response = await registerRequest(email, password);
      return response.data;
    } catch (error) {
      return { message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
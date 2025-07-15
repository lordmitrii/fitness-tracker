import axios from "axios";

let accessToken = null; 

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 5000, // 5 seconds timeout
});

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest.url.includes("/users/refresh") ||
      originalRequest.url.includes("/users/logout")
    ) {
      return Promise.reject(error);
    }

    if (
      error.response &&
      error.response.status === 401 &&
      !error.config._retry
    ) {
      error.config._retry = true;
      try {
        const res = await api.post("/users/refresh"); 
        accessToken = res.data.access_token;
        error.config.headers["Authorization"] = `Bearer ${accessToken}`;
        return api(error.config); 
      } catch (refreshErr) {
        accessToken = null;
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export const setAccessToken = (token) => {
  accessToken = token;
};
export const clearAccessToken = () => {
  accessToken = null;
};

export const loginRequest = (email, password) => {
  return api.post("/users/login", { email, password });
};

export const registerRequest = (email, password) => {
  return api.post("/users/register", { email, password });
};

export default api;

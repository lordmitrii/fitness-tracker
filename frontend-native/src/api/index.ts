import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { logStore } from "@/src/diagnostics/LogStore";

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

interface CustomAxiosError extends Error {
  isOffline?: boolean;
  isTimeout?: boolean;
  config?: InternalAxiosRequestConfig;
  response?: AxiosResponse;
  code?: string;
}

const isOffline = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return !(state.isConnected && state.isInternetReachable);
  } catch {
    return false;
  }
};

const isAuthPath = (url = ""): boolean =>
  /\/users\/(login|register|refresh|logout)/.test(url);

const getBaseURL = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  if (__DEV__) {
    return "http://localhost:8080/api";
  }
  
  return "/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { "Content-Type": "application/json" },
  timeout: 5000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const offline = await isOffline();
    if (offline) {
      const err: CustomAxiosError = new Error("Network error: Offline");
      err.isOffline = true;
      err.config = config;
      return Promise.reject(err);
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

const sleep = (ms: number): Promise<void> => 
  new Promise((resolve) => setTimeout(resolve, ms));

const tryRefresh = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<string | null> => {
    const offline = await isOffline();
    if (offline) {
      const err: CustomAxiosError = Object.assign(new Error("Offline"), { isOffline: true });
      throw err;
    }

    let attempt = 0;
    const MAX = 2;
    while (true) {
      attempt++;
      try {
        const res = await api.post<{ access_token?: string }>("/users/refresh");
        accessToken = res.data.access_token || null;
        return accessToken;
      } catch (e) {
        const error = e as CustomAxiosError;
        const status = error?.response?.status;
        if (error?.isOffline) throw error;
        if (status === 401 || status === 403) throw error;
        if (attempt >= MAX) throw error;
        await sleep(300 * Math.pow(2, attempt - 1));
      }
    }
  })();
  
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.code === "ECONNABORTED") {
      const err: CustomAxiosError = new Error("Request timed out, please try again.");
      err.isTimeout = true;
      err.config = originalRequest;
      throw err;
    }

    const netDown =
      (error as CustomAxiosError).isOffline ||
      (!error.response && error.message === "Network Error");

    if (netDown) {
      const err: CustomAxiosError = new Error("Offline");
      err.isOffline = true;
      err.config = originalRequest;
      throw err;
    }

    if (
      !isAuthPath(originalRequest?.url || "") &&
      error.response?.status === 401 &&
      !originalRequest?._retry
    ) {
      originalRequest._retry = true;
      try {
        const token = await tryRefresh();
        if (token && originalRequest) {
          if (!originalRequest.headers) {
            originalRequest.headers = {} as InternalAxiosRequestConfig['headers'];
          }
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (e) {
        const refreshError = e as CustomAxiosError;
        if (refreshError?.isOffline) {
          const err: CustomAxiosError = new Error("Offline");
          err.isOffline = true;
          err.config = originalRequest;
          throw err;
        }
        accessToken = null;
        throw error;
      }
    }

    try {
      const isAuth = isAuthPath(error.config?.url || "");
      logStore.push({
        level: "error",
        msg: `Axios error: ${error.message}`,
        meta: {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: isAuth ? undefined : error.response?.data,
        },
      });
    } catch {
    }

    throw error;
  }
);

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const clearAccessToken = (): void => {
  accessToken = null;
};

export const loginRequest = (
  username: string,
  password: string
): Promise<AxiosResponse<{ access_token?: string }>> => {
  return api.post("/users/login", { username, password });
};

export const registerRequest = (
  username: string,
  email: string,
  password: string,
  privacyConsent: boolean,
  privacyPolicyVersion: string,
  healthDataConsent: boolean,
  healthDataPolicyVersion: string
): Promise<AxiosResponse> => {
  return api.post("/users/register", {
    username,
    email,
    password,
    privacy_consent: privacyConsent,
    privacy_policy_version: privacyPolicyVersion,
    health_data_consent: healthDataConsent,
    health_data_policy_version: healthDataPolicyVersion,
  });
};

export default api;


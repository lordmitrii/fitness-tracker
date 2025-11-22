import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { logStore } from "@/src/shared/lib/diagnostics/LogStore";
import {
  TokenPair,
  loadStoredTokens,
  persistTokens,
} from "@/src/shared/utils/storage";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let refreshPromiseStartedAt: number | null = null;
let hydratePromise: Promise<void> | null = null;
let tokensHydrated = false;

type TokenChangeReason = "hydrate" | "set" | "refresh" | "clear";

type TokenListener = (payload: { accessToken: string | null; refreshToken: string | null; reason: TokenChangeReason }) => void;

const tokenListeners = new Set<TokenListener>();

const notifyTokenListeners = (reason: TokenChangeReason): void => {
  tokenListeners.forEach((listener) => {
    try {
      listener({ accessToken, refreshToken, reason });
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[auth] token listener failed", error);
      }
    }
  });
};

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
    // Only treat as offline if:
    // 1. Not connected, OR
    // 2. Connected but isInternetReachable is explicitly false
    // If isInternetReachable is null/undefined, assume online (let request try)
    if (!state.isConnected) {
      return true;
    }
    // If connected, only offline if internet is explicitly unreachable
    return state.isInternetReachable === false;
  } catch {
    // If we can't determine, assume online (let the request fail naturally)
    return false;
  }
};

const isAuthPath = (url = ""): boolean =>
  /\/users\/(login|register|refresh|logout)/.test(url);

const isI18nMetaPath = (url = ""): boolean =>
  /\/i18n\/meta/.test(url);

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

const applyTokens = (
  { accessToken: nextAccess, refreshToken: nextRefresh }: TokenPair,
  reason: TokenChangeReason = "set"
): void => {
  accessToken = nextAccess || null;
  refreshToken = nextRefresh || null;
  tokensHydrated = true;
  void persistTokens({ accessToken, refreshToken });
  notifyTokenListeners(reason);
};

const ensureTokensHydrated = async (): Promise<void> => {
  if (tokensHydrated) return;
  if (!hydratePromise) {
    hydratePromise = (async () => {
      const stored = await loadStoredTokens();
      applyTokens(stored, "hydrate");
    })().finally(() => {
      hydratePromise = null;
    });
  }
  await hydratePromise;
};

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    await ensureTokensHydrated();
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const offline = await isOffline();
    if (offline) {
      const err: CustomAxiosError = new Error("Network error: Offline");
      err.isOffline = true;
      err.config = config;
      if (isI18nMetaPath(config.url || "")) {
        (err as any).isNonCritical = true;
      }
      return Promise.reject(err);
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

const sleep = (ms: number): Promise<void> => 
  new Promise((resolve) => setTimeout(resolve, ms));

const performRefreshRequest = async (): Promise<string | null> => {
  await ensureTokensHydrated();
  if (!refreshToken) return null;

  const res = await api.post<{ access_token?: string; refresh_token?: string }>(
    "/users/refresh",
    { refresh_token: refreshToken }
  );
  const nextAccess = res.data.access_token || null;
  const nextRefresh = res.data.refresh_token ?? refreshToken;
  applyTokens({ accessToken: nextAccess, refreshToken: nextRefresh }, "refresh");
  return nextAccess;
};

const REFRESH_PROMISE_TTL = 7000;

const tryRefresh = async (): Promise<string | null> => {
  if (refreshPromise && refreshPromiseStartedAt) {
    const age = Date.now() - refreshPromiseStartedAt;
    if (age > REFRESH_PROMISE_TTL) {
      refreshPromise = null;
      refreshPromiseStartedAt = null;
    }
  }
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
        const refreshed = await performRefreshRequest();
        return refreshed;
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
  refreshPromiseStartedAt = Date.now();
  
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
    refreshPromiseStartedAt = null;
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
      if ((error as any).isNonCritical || isI18nMetaPath(originalRequest?.url || "")) {
        (err as any).isNonCritical = true;
      }
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
        applyTokens({ accessToken: null, refreshToken: null }, "clear");
        throw error;
      }
    }

    try {
      const isNonCritical = (error as any).isNonCritical || isI18nMetaPath(error.config?.url || "");
      if (!isNonCritical) {
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
      }
    } catch {
    }

    throw error;
  }
);

export const setAuthTokens = (tokens: TokenPair): void => {
  applyTokens(tokens, "set");
};

export const clearAuthTokens = (): void => {
  applyTokens({ accessToken: null, refreshToken: null }, "clear");
};

export const hydrateAuthTokens = async (): Promise<void> => {
  await ensureTokensHydrated();
};

export const refreshAccessToken = async (): Promise<string | null> => {
  return tryRefresh();
};

export const getRefreshToken = (): string | null => refreshToken;

export const subscribeToAuthTokens = (listener: TokenListener): (() => void) => {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
};

export const loginRequest = (
  username: string,
  password: string
): Promise<AxiosResponse<{ access_token?: string; refresh_token?: string }>> => {
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


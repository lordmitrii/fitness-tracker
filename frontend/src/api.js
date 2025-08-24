import axios from "axios";
import { logStore } from "./diagnostics/LogStore";

let accessToken = null;
let refreshPromise = null;

const isOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

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

    if (isOffline()) {
      const err = new Error("Network error: Offline");
      err.isOffline = true;
      err.config = config;
      return Promise.reject(err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tryRefresh = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    if (isOffline())
      throw Object.assign(new Error("Offline"), { isOffline: true });

    let attempt = 0;
    const MAX = 2;
    while (true) {
      attempt++;
      try {
        const res = await api.post("/users/refresh");
        accessToken = res.data.access_token || null;
        return accessToken;
      } catch (e) {
        const status = e?.response?.status;
        if (e?.isOffline) throw e;
        if (status === 401 || status === 403) throw e;
        if (attempt >= MAX) throw e;
        await sleep(300 * Math.pow(2, attempt - 1)); // 300ms, 600ms
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    const netDown =
      error.isOffline ||
      (!error.response &&
        (error.code === "ECONNABORTED" || error.message === "Network Error"));

    if (netDown) {
      const err = new Error("Offline");
      err.isOffline = true;
      err.config = originalRequest;
      throw err;
    }

    const isAuthPath = /\/users\/(login|register|refresh|logout)/.test(
      originalRequest.url || ""
    );

    // Token expired => try refresh once.
    if (
      !isAuthPath &&
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const token = await tryRefresh();
        if (token) {
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${token}`,
          };
          return api(originalRequest);
        }
      } catch (e) {
        // If offline now, bubble an offline error so UI doesnt force logout
        if (e?.isOffline) {
          const err = new Error("Offline");
          err.isOffline = true;
          err.config = originalRequest;
          throw err;
        }
        // Hard failure => clear token so caller can route to login if needed
        accessToken = null;
        throw error;
      }
    }
    try {
      const isAuth = /\/users\/(login|register|refresh|logout)/.test(
        error.config?.url || ""
      );
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
    } catch {}

    throw error;
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

export const registerRequest = (
  email,
  password,
  privacyConsent,
  privacyPolicyVersion,
  healthDataConsent,
  healthDataPolicyVersion
) => {
  return api.post("/users/register", {
    email,
    password,
    privacy_consent: privacyConsent,
    privacy_policy_version: privacyPolicyVersion,
    health_data_consent: healthDataConsent,
    health_data_policy_version: healthDataPolicyVersion,
  });
};

export default api;

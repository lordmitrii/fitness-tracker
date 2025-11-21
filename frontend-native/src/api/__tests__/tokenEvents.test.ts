import { describe, it, expect, vi, beforeEach } from "vitest";

const mockNetInfoState = { isConnected: true, isInternetReachable: true };

vi.mock("@react-native-community/netinfo", () => ({
  default: {
    addEventListener: vi.fn(() => () => undefined),
    fetch: vi.fn(() => Promise.resolve(mockNetInfoState)),
  },
}));

vi.mock("@/src/diagnostics/LogStore", () => ({
  logStore: { push: vi.fn() },
}));

const axiosInstance = vi.hoisted(() => ({
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  post: vi.fn(async (url: string) => {
    if (url === "/users/refresh") {
      return {
        data: {
          access_token: "refreshed-token",
          refresh_token: "next-refresh",
        },
      };
    }
    return { data: {} };
  }),
}));

vi.mock("axios", () => {
  const create = vi.fn(() => axiosInstance);
  return {
    default: Object.assign(create, {
      create,
    }),
  };
});

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
    removeItem: vi.fn(async () => undefined),
  },
}));

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

import {
  clearAuthTokens,
  refreshAccessToken,
  setAuthTokens,
  subscribeToAuthTokens,
} from "@/src/api";

describe("auth token event emitter", () => {
  beforeEach(() => {
    axiosInstance.post.mockClear();
  });

  it("notifies listeners on manual set and clear actions", () => {
    const reasons: string[] = [];
    const unsubscribe = subscribeToAuthTokens(({ reason }) => reasons.push(reason));

    setAuthTokens({ accessToken: "token-a", refreshToken: "refresh-a" });
    clearAuthTokens();
    unsubscribe();

    expect(reasons).toEqual(["set", "clear"]);
  });

  it("emits refresh reason after successful token refresh", async () => {
    const reasons: string[] = [];
    const unsubscribe = subscribeToAuthTokens(({ reason }) => reasons.push(reason));

    setAuthTokens({ accessToken: "token-a", refreshToken: "refresh-a" });

    const refreshed = await refreshAccessToken();
    expect(refreshed).toBe("refreshed-token");
    expect(reasons).toContain("refresh");
    unsubscribe();
  });
});


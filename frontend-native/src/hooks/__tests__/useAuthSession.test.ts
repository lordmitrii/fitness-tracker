import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthSession } from "@/src/hooks/useAuthSession";

const apiMocks = vi.hoisted(() => ({
  hydrateAuthTokens: vi.fn(() => Promise.resolve()),
  refreshAccessToken: vi.fn(() => Promise.resolve("next-token")),
  clearAuthTokens: vi.fn(),
  setAuthTokens: vi.fn(),
  subscribeToAuthTokens: vi.fn(() => () => undefined),
}));

vi.mock("@/src/api", () => apiMocks);

describe("useAuthSession", () => {
  beforeEach(() => {
    apiMocks.refreshAccessToken.mockResolvedValue("next-token");
    apiMocks.hydrateAuthTokens.mockResolvedValue(undefined);
    vi.clearAllMocks();
  });

  it("invokes onPostRefresh callback with authenticated result", async () => {
    const onPostRefresh = vi.fn();
    const { result } = renderHook(() => useAuthSession({ onPostRefresh }));

    await act(async () => {
      await result.current.refreshSession();
    });

    expect(onPostRefresh).toHaveBeenCalledWith("authenticated", "manual");
  });

  it("treats offline refresh failures as offline status and does not throw", async () => {
    apiMocks.refreshAccessToken.mockRejectedValueOnce({ isOffline: true });
    const onPostRefresh = vi.fn();
    const { result } = renderHook(() => useAuthSession({ onPostRefresh }));

    await act(async () => {
      const status = await result.current.refreshSession();
      expect(status).toBe("offline");
    });

    expect(onPostRefresh).toHaveBeenCalledWith("offline", "manual");
  });
});


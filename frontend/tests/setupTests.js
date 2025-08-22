import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

if (!("ResizeObserver" in window)) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
}

if (!("IntersectionObserver" in window)) {
  class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "0px";
    thresholds = [];
  }
  window.IntersectionObserver = IntersectionObserver;
}

if (!("URL" in window)) {
  window.URL = {};
}
if (!("createObjectURL" in URL)) {
  URL.createObjectURL = vi.fn(() => "blob:vitest-mock");
}
if (!("revokeObjectURL" in URL)) {
  URL.revokeObjectURL = vi.fn();
}

if (!navigator.clipboard) {
  navigator.clipboard = {
    writeText: vi.fn(async () => {}),
    readText: vi.fn(async () => ""),
  };
}

if (!("canShare" in navigator)) {
  navigator.canShare = () => false;
}
if (!("share" in navigator)) {
  navigator.share = vi.fn(async () => {
    throw new Error("Web Share not supported in tests");
  });
}

if (!("serviceWorker" in navigator)) {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      controller: null,
      ready: Promise.resolve({
        active: null,
        installing: null,
        waiting: null,
      }),
      register: vi.fn(async () => ({
        update: vi.fn(),
        unregister: vi.fn(async () => true),
        installing: null,
        waiting: null,
        active: null,
      })),
      getRegistration: vi.fn(async () => null),
      getRegistrations: vi.fn(async () => []),
    },
  });
}

if (!globalThis.crypto) {
  globalThis.crypto = {};
}
if (typeof globalThis.crypto.randomUUID !== "function") {
  globalThis.crypto.randomUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

if (typeof globalThis.TextEncoder === "undefined") {
  const { TextEncoder } = await import("util");
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  const { TextDecoder } = await import("util");
  globalThis.TextDecoder = TextDecoder;
}

if (typeof globalThis.fetch === "undefined") {
  globalThis.fetch = vi.fn(
    async () =>
      new Response("", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      })
  );
}

vi.mock("virtual:pwa-register", () => ({
  registerSW: () => {
    return () => {};
  },
}));

// vi.spyOn(console, "error").mockImplementation(() => {});
// vi.spyOn(console, "warn").mockImplementation(() => {});

import { TextEncoder, TextDecoder } from "util";
import { webcrypto } from "node:crypto";
import { vi } from "vitest";

if (!(globalThis as { TextEncoder?: typeof TextEncoder }).TextEncoder) {
  (globalThis as { TextEncoder?: typeof TextEncoder }).TextEncoder = TextEncoder;
}

if (!(globalThis as { TextDecoder?: typeof TextDecoder }).TextDecoder) {
  (globalThis as { TextDecoder?: typeof TextDecoder }).TextDecoder = TextDecoder as any;
}

(globalThis as { __DEV__?: boolean }).__DEV__ = (globalThis as { __DEV__?: boolean }).__DEV__ ?? false;

if (!globalThis.crypto) {
  (globalThis as { crypto?: Crypto }).crypto = webcrypto as Crypto;
}

if (typeof globalThis.process === 'undefined') {
  (globalThis as { process?: NodeJS.Process }).process = {
    env: {
      EXPO_OS: 'web',
      NODE_ENV: 'test',
    },
  } as NodeJS.Process;
}

vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native');
  return {
    ...actual,
    Platform: {
      OS: 'web',
      select: (obj: Record<string, any>) => obj.web || obj.default,
    },
    Dimensions: {
      get: (dimension: string) => {
        if (dimension === 'window') {
          return { width: 375, height: 812, scale: 2, fontScale: 1 };
        }
        return { width: 375, height: 812, scale: 2, fontScale: 1 };
      },
      addEventListener: () => ({ remove: () => { } }),
      removeEventListener: () => { },
    },
  };
});

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(() => Promise.resolve()),
  notificationAsync: vi.fn(() => Promise.resolve()),
  selectionAsync: vi.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSegments: () => [],
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  },
  Redirect: ({ href }: { href: string }) => null,
  Stack: ({ children }: { children: React.ReactNode }) => children,
  Tabs: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
    getAllKeys: vi.fn(() => Promise.resolve([])),
    multiGet: vi.fn(() => Promise.resolve([])),
    multiSet: vi.fn(() => Promise.resolve()),
    multiRemove: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(() => Promise.resolve(null)),
  setItemAsync: vi.fn(() => Promise.resolve()),
  deleteItemAsync: vi.fn(() => Promise.resolve()),
}));

vi.mock('@react-native-community/netinfo', () => ({
  default: {
    fetch: vi.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
    addEventListener: vi.fn(() => () => { }),
  },
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));


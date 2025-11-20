import AsyncStorage from "@react-native-async-storage/async-storage";

const MAX = 1000;
const KEY = "app:logs:v1";
const levels = ["log", "info", "warn", "error"] as const;

export type LogLevel = typeof levels[number];

export interface LogEntry {
  level?: LogLevel;
  msg: string;
  ts?: number;
  meta?: Record<string, unknown>;
}

class LogStore {
  private buf: LogEntry[] = [];
  private subs = new Set<() => void>();

  constructor() {
    this.load();
  }

  private async load() {
    try {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved) {
        this.buf = JSON.parse(saved);
      }
    } catch {
      this.buf = [];
    }
  }

  push(entry: LogEntry) {
    const withTs: LogEntry = { ...entry, ts: Date.now() };
    this.buf.push(withTs);
    if (this.buf.length > MAX) {
      this.buf.splice(0, this.buf.length - MAX);
    }
    this.save();
    this.subs.forEach((s) => s());
  }

  private async save() {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(this.buf));
    } catch {
      // Ignore save errors
    }
  }

  list(): LogEntry[] {
    return this.buf.slice(-MAX);
  }

  clear() {
    this.buf = [];
    AsyncStorage.removeItem(KEY).catch(() => {
      // Ignore clear errors
    });
    this.subs.forEach((s) => s());
  }

  subscribe(fn: () => void): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
}

export const logStore = new LogStore();

// Override console methods in non-test environments
if (typeof __DEV__ !== "undefined" && __DEV__) {
  levels.forEach((level) => {
    const original = (console as unknown as Record<string, typeof console.log>)[level];
    if (original) {
      (console as unknown as Record<string, typeof console.log>)[level] = (...args: unknown[]) => {
        try {
          const msg = args
            .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
            .join(" ");
          logStore.push({ level, msg });
        } catch {
          // Ignore logging errors
        }
        original.apply(console, args);
      };
    }
  });
}


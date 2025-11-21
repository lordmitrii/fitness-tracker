import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const MAX = 1000;
const KEY = "app:logs:v1";
const levels = ["log", "info", "warn", "error"] as const;
const canUseAsyncStorage =
  Platform.OS !== "web" || typeof window !== "undefined";

export type LogLevel = (typeof levels)[number];

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
      if (canUseAsyncStorage) {
        const saved = await AsyncStorage.getItem(KEY);
        if (saved) {
          this.buf = JSON.parse(saved);
        }
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
    if (!canUseAsyncStorage) return;
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(this.buf));
    } catch {
    }
  }

  list(): LogEntry[] {
    return this.buf.slice(-MAX);
  }

  clear() {
    this.buf = [];
    if (canUseAsyncStorage) {
      AsyncStorage.removeItem(KEY).catch(() => {});
    }
    this.subs.forEach((s) => s());
  }

  subscribe(fn: () => void): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
}

export const logStore = new LogStore();

if (typeof __DEV__ !== "undefined" && __DEV__) {
  levels.forEach((level) => {
    const original = (console as unknown as Record<string, typeof console.log>)[
      level
    ];
    if (original) {
      (console as unknown as Record<string, typeof console.log>)[level] = (
        ...args: unknown[]
      ) => {
        try {
          const msg = args
            .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
            .join(" ");
          logStore.push({ level, msg });
        } catch {
        }
        original.apply(console, args);
      };
    }
  });
}

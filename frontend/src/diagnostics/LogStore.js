const MAX = 1000;
const KEY = "app:logs:v1";
const levels = ["log", "info", "warn", "error"];

class LogStore {
  constructor() {
    try {
      this.buf = JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      this.buf = [];
    }
    this.subs = new Set();
  }
  push(entry) {
    const withTs = { ...entry, ts: Date.now() };
    this.buf.push(withTs);
    if (this.buf.length > MAX) this.buf.splice(0, this.buf.length - MAX);
    try {
      localStorage.setItem(KEY, JSON.stringify(this.buf));
    } catch {}
    this.subs.forEach((s) => s());
  }
  list() {
    return this.buf.slice(-MAX);
  }
  clear() {
    this.buf = [];
    try {
      localStorage.removeItem(KEY);
    } catch {}
    this.subs.forEach((s) => s());
  }
  subscribe(fn) {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
}
export const logStore = new LogStore();

const isTest =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.MODE === "test";

if (!isTest) {
  levels.forEach((level) => {
    const original = console[level];
    console[level] = (...args) => {
      try {
        const msg = args
          .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
          .join(" ");
        logStore.push({ level, msg });
      } catch {}
      original.apply(console, args);
    };
  });
}

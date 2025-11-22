import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import api from "@/src/shared/api";

const STORAGE_KEY = "i18n_missing_reported_v1";
const reported = new Set<string>();
let queue: Array<{
  languages: string[];
  namespace: string;
  key: string;
  meta?: { path?: string };
}> = [];
let timer: number | null = null;
const canUseAsyncStorage =
  Platform.OS !== "web" || typeof window !== "undefined";

if (canUseAsyncStorage) {
  (async function boot() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => reported.add(id));
        }
      }
    } catch (error) {
    }
  })();
}

function persistSoon() {
  if (!canUseAsyncStorage) return;
  try {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Array.from(reported))
    ).catch(() => {
    });
  } catch {
  }
}

function makeId(
  langs: string[],
  ns: string,
  key: string,
  meta?: Record<string, any>
): string {
  const normLangs = Array.from(
    new Set(langs.map((l) => l.split("-")[0]))
  ).sort();

  const versionKey = normLangs
    .map((l) => {
      if (!meta) return "0";
      const v = meta[l];
      if (v && typeof v === "object" && v !== null) {
        return (v as any)[ns] || "0";
      }
      if (typeof v === "string" || typeof v === "number") {
        return String(v);
      }
      return "0";
    })
    .join(",");

  return `${ns}|${normLangs.join(",")}|${key}|${versionKey}`;
}

interface ReportMissingOptions {
  meta?: Record<string, any>;
  batchMs?: number;
  includeMeta?: boolean;
}

export function reportMissing(
  languages: string[],
  namespace: string,
  key: string,
  options?: ReportMissingOptions
): void {
  const id = makeId(languages, namespace, key, options?.meta);
  if (reported.has(id)) return;
  reported.add(id);
  persistSoon();

  const item = {
    languages: Array.from(new Set(languages.map((l) => l.split("-")[0]))),
    namespace,
    key,
    meta: options?.includeMeta
      ? {
        }
      : undefined,
  };
  queue.push(item);

  const wait = options?.batchMs ?? 1000;
  if (!timer) {
    timer = setTimeout(flush, wait);
  }
}

async function flush(): Promise<void> {
  const items = queue;
  queue = [];
  timer = null;

  if (!items.length) return;

  try {
    await api.post("/i18n/missing/batch", { items });
  } catch {
    await Promise.allSettled(
      items.map((it) =>
        api.post("/i18n/missing", {
          languages: it.languages,
          namespace: it.namespace,
          key: it.key,
        })
      )
    );
  }
}

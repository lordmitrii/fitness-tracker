// lib/utils/missingReporter.ts
import api from "@/src/api";

const reported = new Set<string>();

interface ReportItem {
  languages: string[];
  namespace: string;
  key: string;
  meta?: {
    path: string;
  };
}

interface ReportMissingOptions {
  meta?: Record<string, any>;
  batchMs?: number;
  includeMeta?: boolean;
}

let queue: ReportItem[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function makeId(
  languages: string[],
  ns: string,
  key: string,
  meta?: Record<string, any>
): string {
  const normLangs = Array.from(
    new Set(languages.map((l) => l.split("-")[0]))
  ).sort();

  const versionKey = normLangs
    .map((l) => {
      if (!meta) return "0";
      const v = meta[l];
      if (v && typeof v === "object") {
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

export function reportMissing(
  languages: readonly string[] | string,
  namespace: string,
  key: string,
  options?: ReportMissingOptions
): void {
  const langArr: string[] = Array.isArray(languages)
    ? [...languages]
    : [languages];

  const id = makeId(langArr, namespace, key, options?.meta);
  if (reported.has(id)) return;
  reported.add(id);

  const item: ReportItem = {
    languages: Array.from(new Set(langArr.map((l) => l.split("-")[0]))),
    namespace,
    key,
    meta: options?.includeMeta
      ? {
          // In web version you used window.location.pathname;
          // in RN we leave this empty (you can wire navigation path later if you want).
          path: "",
        }
      : undefined,
  };

  queue.push(item);

  const wait = options?.batchMs ?? 1000;
  if (!timer) {
    timer = setTimeout(flush, wait);
  }
}

async function flush() {
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

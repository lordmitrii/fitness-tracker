import api from "../api";

const STORAGE_KEY = "i18n_missing_reported_v1";
const reported = new Set();
let queue = [];
let timer = null;

(function boot() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) saved.forEach((id) => reported.add(id));
  } catch {}
})();

function persistSoon() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(reported)));
  } catch {}
}

function makeId(langs, ns, key, meta) {
  const normLangs = Array.from(
    new Set(langs.map((l) => l.split("-")[0]))
  ).sort();

  const versionKey = normLangs
    .map((l) => {
      if (!meta) return "0";
      const v = meta[l];
      if (v && typeof v === "object" && v !== null) {
        return v[ns] || "0";
      }
      if (typeof v === "string" || typeof v === "number") {
        return String(v);
      }
      return "0";
    })
    .join(",");

  return `${ns}|${normLangs.join(",")}|${key}|${versionKey}`;
}

export function reportMissing(languages, namespace, key, options) {
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
          path:
            (typeof window !== "undefined" && window.location?.pathname) || "",
        }
      : undefined,
  };
  queue.push(item);

  const wait = options?.batchMs ?? 1000;
  if (!timer) timer = setTimeout(flush, wait);
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

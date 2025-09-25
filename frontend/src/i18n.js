import { reportMissing } from "./utils/missingReporter";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import LocalStorageBackend from "i18next-localstorage-backend";
import ChainedBackend from "i18next-chained-backend";
import { initReactI18next } from "react-i18next";
import api from "./api";

const isDev = import.meta.env.DEV;

const supportedLngs = ["en", "ru", "zh"];
const namespaces = ["translation"];

const params = new URLSearchParams({
  locales: supportedLngs.join(","),
  namespaces: namespaces.join(","),
});

const cachedMetaStr = localStorage.getItem("i18n:meta") || "{}";
let latestMeta = {};
try {
  latestMeta = JSON.parse(cachedMetaStr);
} catch {
  latestMeta = {};
}

function flatten(meta) {
  return Object.fromEntries(
    supportedLngs.map((lng) => [
      lng,
      namespaces.map((ns) => meta[lng]?.[ns] ?? "1").join("|"),
    ])
  );
}
let lsVersions = flatten(latestMeta);

i18n
  .use(LanguageDetector)
  .use(ChainedBackend)
  .use(initReactI18next)
  .init({
    backend: {
      backends: [LocalStorageBackend, HttpBackend],
      backendOptions: [
        { expirationTime: 7 * 24 * 60 * 60 * 1000, versions: lsVersions },
        {
          loadPath: "/i18n/{{lng}}/{{ns}}",
          allowMultiLoading: true,
          request: (options, url, payload, cb) => {
            api
              .get(url)
              .then((res) =>
                cb(null, {
                  data: res.data,
                  status: res.status,
                  headers: res.headers,
                })
              )
              .catch((err) => cb(err));
          },
        },
      ],
    },
    ns: namespaces,
    defaultNS: "translation",
    load: "languageOnly",
    supportedLngs,
    fallbackLng: "en",
    nonExplicitSupportedLngs: true,
    preload: ["en"],
    detection: {
      order: ["localStorage", "navigator", "htmlTag", "path", "subdomain"],
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },

    saveMissing: true,
    saveMissingTo: "current", // 'all' 
    missingKeyHandler: (languages, namespace, key) => {
      if (isDev) return;
      reportMissing(languages, namespace, key, {
        meta: latestMeta,
        batchMs: 1000,
        includeMeta: true,
      });
    },
  });

let metaETag = localStorage.getItem("i18n:meta:etag") || undefined;

function getLocalStorageBackend() {
  return i18n.services.backendConnector?.backend?.backends?.[0];
}
function setBackendVersions(v) {
  const ls = getLocalStorageBackend();
  if (ls?.options) ls.options.versions = v;
}

async function refreshMeta() {
  try {
    const res = await api.get(`/i18n/meta?${params.toString()}`, {
      headers: {
        "Cache-Control": "no-cache",
        ...(metaETag ? { "If-None-Match": metaETag } : {}),
      },
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });

    if (res.status === 304) return;

    metaETag = res.headers?.etag;
    if (metaETag) localStorage.setItem("i18n:meta:etag", metaETag);

    const newMeta = res.data?.versions ?? {};
    const newLsVersions = flatten(newMeta);

    if (JSON.stringify(newLsVersions) !== JSON.stringify(lsVersions)) {
      latestMeta = newMeta;
      lsVersions = newLsVersions;

      localStorage.setItem("i18n:meta", JSON.stringify(latestMeta));

      setBackendVersions(lsVersions);

      const currentBase = i18n.language?.split("-")[0] || "en";
      await i18n.reloadResources([currentBase], namespaces);

      i18n.emit("languageChanged", i18n.language);
    }
  } catch (err) {
    console.error("i18n meta refresh failed", err);
  }
}

refreshMeta();
// window.addEventListener("visibilitychange", () => {
//   if (document.visibilityState === "visible") refreshMeta();
// });

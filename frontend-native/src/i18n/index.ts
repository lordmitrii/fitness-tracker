import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HttpBackend from "i18next-http-backend";
import ChainedBackend from "i18next-chained-backend";
import type { BackendModule, ReadCallback } from "i18next";
import AsyncStorageBackend from "./asyncStorageBackend";
import { reportMissing } from "./missingReporter";
import api from "../api";

import enTranslation from "./locales/en/translation.json";
import ruTranslation from "./locales/ru/translation.json";
import zhTranslation from "./locales/zh/translation.json";

const isDev = __DEV__;

const supportedLngs = ["en", "ru", "zh"];
const namespaces = ["translation"];

const params = new URLSearchParams({
  locales: supportedLngs.join(","),
  namespaces: namespaces.join(","),
});

let latestMeta: Record<string, Record<string, string>> = {};
let metaETag: string | undefined;

async function loadCachedMeta(): Promise<void> {
  try {
    const cachedMetaStr = await AsyncStorage.getItem("i18n:meta");
    if (cachedMetaStr) {
      latestMeta = JSON.parse(cachedMetaStr);
    }
    const etag = await AsyncStorage.getItem("i18n:meta:etag");
    if (etag) {
      metaETag = etag;
    }
  } catch (error) {
    console.error("Failed to load cached i18n meta:", error);
    latestMeta = {};
  }
}

function flatten(
  meta: Record<string, Record<string, string>>
): Record<string, string> {
  return Object.fromEntries(
    supportedLngs.map((lng) => [
      lng,
      namespaces.map((ns) => meta[lng]?.[ns] ?? "1").join("|"),
    ])
  );
}

loadCachedMeta();
let lsVersions = flatten(latestMeta);

function getDeviceLanguage(): string {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const locale = locales[0];
    const languageCode = locale.languageCode?.toLowerCase() || "en";

    if (supportedLngs.includes(languageCode)) {
      return languageCode;
    }

    const baseLanguage = languageCode.split("-")[0];
    if (supportedLngs.includes(baseLanguage)) {
      return baseLanguage;
    }
  }

  return "en";
}

const bundledTranslations: Record<string, Record<string, any>> = {
  en: {
    translation: enTranslation,
  },
  ru: {
    translation: ruTranslation,
  },
  zh: {
    translation: zhTranslation,
  },
};

class BundledResourceBackend implements BackendModule {
  type = "backend" as const;

  init(services: any, backendOptions: any, i18nextOptions: any): void {
  }

  read(language: string, namespace: string, callback: ReadCallback): void {
    const lang = language.split("-")[0];
    const translations = bundledTranslations[lang]?.[namespace];

    if (translations) {
      callback(null, translations);
    } else {
      const fallback = bundledTranslations.en?.[namespace];
      if (fallback) {
        callback(null, fallback);
      } else {
        callback(new Error(`Translation not found: ${lang}/${namespace}`), null);
      }
    }
  }
}

const resourceBackend = new BundledResourceBackend();

const httpBackendOptions = {
  loadPath: "/i18n/{{lng}}/{{ns}}",
  allowMultiLoading: true,
  request: (
    options: any,
    url: string,
    payload: any,
    callback: (error: Error | null, data?: any) => void
  ) => {
    // Use the API instance which already has baseURL configured
    api
      .get(url)
      .then((res) => {
        callback(null, {
          data: res.data,
          status: res.status,
          headers: res.headers,
        });
      })
      .catch((err) => {
        callback(err as Error);
      });
  },
};

async function getSavedLanguage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem("i18n:language");
  } catch {
    return null;
  }
}

async function initI18n(): Promise<void> {
  const savedLanguage = await getSavedLanguage();
  const deviceLanguage = getDeviceLanguage();
  const initialLanguage = savedLanguage || deviceLanguage;

  i18n
    .use(ChainedBackend)
    .use(initReactI18next)
    .init({
      lng: initialLanguage,
      backend: {
        backends: [AsyncStorageBackend, HttpBackend, resourceBackend],
        backendOptions: [
          {
            expirationTime: 7 * 24 * 60 * 60 * 1000,
            versions: lsVersions,
          },
          httpBackendOptions,
          {},
        ],
      },
      ns: namespaces,
      defaultNS: "translation",
      load: "languageOnly",
      supportedLngs,
      fallbackLng: "en",
      nonExplicitSupportedLngs: true,
      preload: ["en"],
      interpolation: { escapeValue: false },
      saveMissing: true,
      saveMissingTo: "current",
      missingKeyHandler: (languages, namespace, key) => {
        if (isDev) return;
        reportMissing([...languages], namespace, key, {
          meta: latestMeta,
          batchMs: 1000,
          includeMeta: true,
        });
      },
    });

  i18n.on("languageChanged", (lng) => {
    AsyncStorage.setItem("i18n:language", lng).catch(() => {
    });
  });
}

function getAsyncStorageBackend(): AsyncStorageBackend | null {
  return (i18n.services.backendConnector?.backend?.backends?.[0] as AsyncStorageBackend) || null;
}

function setBackendVersions(v: Record<string, string>): void {
  const backend = getAsyncStorageBackend();
  if (backend && (backend as any).options) {
    (backend as any).options.versions = v;
  }
}

async function refreshMeta(): Promise<void> {
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
    if (metaETag) {
      await AsyncStorage.setItem("i18n:meta:etag", metaETag);
    }

    const newMeta = res.data?.versions ?? {};
    const newLsVersions = flatten(newMeta);

    if (JSON.stringify(newLsVersions) !== JSON.stringify(lsVersions)) {
      latestMeta = newMeta;
      lsVersions = newLsVersions;

      await AsyncStorage.setItem("i18n:meta", JSON.stringify(latestMeta));

      setBackendVersions(lsVersions);

      const currentBase = i18n.language?.split("-")[0] || "en";
      await i18n.reloadResources([currentBase], namespaces);

      i18n.emit("languageChanged", i18n.language);
    }
  } catch (err) {
    console.error("i18n meta refresh failed", err);
  }
}

initI18n()
  .then(() => {
    return refreshMeta();
  })
  .catch((error) => {
    console.error("Failed to initialize i18n:", error);
  });

export default i18n;


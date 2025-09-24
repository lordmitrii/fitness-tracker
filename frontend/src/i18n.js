import { reportMissing } from "./utils/missingReporter";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import LocalStorageBackend from "i18next-localstorage-backend";
import ChainedBackend from "i18next-chained-backend";
import { initReactI18next } from "react-i18next";
import api from "./api";

const versions = { en: "1.0", ru: "1.0", zh: "1.0" };
const isDev = import.meta.env.DEV;

i18n
  .use(LanguageDetector)
  .use(ChainedBackend)
  .use(initReactI18next)
  .init({
    backend: {
      backends: [LocalStorageBackend, HttpBackend],
      backendOptions: [
        { expirationTime: 7 * 24 * 60 * 60 * 1000, versions },
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
    ns: ["translation"],
    defaultNS: "translation",
    load: "languageOnly",
    supportedLngs: ["en", "ru", "zh"],
    fallbackLng: "en",
    nonExplicitSupportedLngs: true,
    preload: ["en"],
    detection: {
      order: ["localStorage", "navigator", "htmlTag", "path", "subdomain"],
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },

    saveMissing: true,
    saveMissingTo: "current", // or all
    missingKeyHandler: (languages, namespace, key) => {
      if (isDev) return;

      reportMissing(languages, namespace, key, {
        versions,
        batchMs: 1000,
        includeMeta: true,
      });
    },
  });



import { I18N_CONFIG, type SupportedLanguage, type Namespace } from '../config';
import type { TranslationData } from '../Types';
import { TranslationNotFoundError } from '../Types';

import enTranslation from '../locales/en/translation.json';
import ruTranslation from '../locales/ru/translation.json';
import zhTranslation from '../locales/zh/translation.json';

const bundledTranslations: Record<SupportedLanguage, Record<Namespace, TranslationData>> = {
  en: {
    translation: enTranslation as TranslationData,
  },
  ru: {
    translation: ruTranslation as TranslationData,
  },
  zh: {
    translation: zhTranslation as TranslationData,
  },
};

export function loadBundledTranslation(
  language: SupportedLanguage,
  namespace: Namespace = I18N_CONFIG.defaultNamespace
): TranslationData {
  const lang = language.split('-')[0] as SupportedLanguage;
  
  
  if (bundledTranslations[lang]?.[namespace]) {
    return bundledTranslations[lang][namespace];
  }
  
  
  if (bundledTranslations[I18N_CONFIG.defaultLanguage]?.[namespace]) {
    return bundledTranslations[I18N_CONFIG.defaultLanguage][namespace];
  }
  
  
  console.warn(
    `[i18n] Bundled translation not found: ${lang}/${namespace}, using empty object`
  );
  return {};
}

export function hasBundledTranslation(
  language: SupportedLanguage,
  namespace: Namespace = I18N_CONFIG.defaultNamespace
): boolean {
  const lang = language.split('-')[0] as SupportedLanguage;
  return !!(bundledTranslations[lang]?.[namespace] || 
            bundledTranslations[I18N_CONFIG.defaultLanguage]?.[namespace]);
}

export function getBundledLanguages(): SupportedLanguage[] {
  return I18N_CONFIG.supportedLanguages.filter(lang => 
    bundledTranslations[lang]?.[I18N_CONFIG.defaultNamespace]
  );
}



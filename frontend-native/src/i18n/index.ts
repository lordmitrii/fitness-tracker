import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18N_CONFIG, type SupportedLanguage } from './config';
import { detectLanguage, getDeviceLanguageSync } from './detection/language';
import { loadBundledTranslation } from './loading/bundled';
import { loadAndMergeTranslation } from './loading/manager';
import { startUpdateChecker, stopUpdateChecker } from './sync/updater';
import { getCachedMeta, getCachedTranslation } from './storage/cache';
import { saveLanguage, getSavedLanguage } from './storage/preferences';
import { logError } from './utils/errors';

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
let currentLanguage: SupportedLanguage = I18N_CONFIG.defaultLanguage;

function normalizeLanguage(language: string | null | undefined): SupportedLanguage {
  const base = (language || I18N_CONFIG.defaultLanguage).split('-')[0] as SupportedLanguage;
  return I18N_CONFIG.supportedLanguages.includes(base)
    ? base
    : I18N_CONFIG.defaultLanguage;
}

function handleLanguageChanged(language: string): void {
  const normalized = normalizeLanguage(language);
  currentLanguage = normalized;

  void saveLanguage(normalized).catch(error => {
    logError(error, 'handleLanguageChanged', { language: normalized });
  });
}

async function determineInitialLanguage(): Promise<SupportedLanguage> {
  const saved = await getSavedLanguage();
  if (saved) {
    return saved;
  }

  return normalizeLanguage(getDeviceLanguageSync());
}

function initializeWithBundled(initialLanguage: SupportedLanguage): void {
  if (isInitialized) {
    return;
  }

  currentLanguage = initialLanguage;

  const resources: Record<string, Record<string, any>> = {};
  
  for (const lang of I18N_CONFIG.supportedLanguages) {
    resources[lang] = {};
    for (const ns of I18N_CONFIG.namespaces) {
      resources[lang][ns] = loadBundledTranslation(lang, ns);
    }
  }
  
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: currentLanguage,
      fallbackLng: I18N_CONFIG.defaultLanguage,
      supportedLngs: I18N_CONFIG.supportedLanguages,
      ns: I18N_CONFIG.namespaces,
      defaultNS: I18N_CONFIG.defaultNamespace,
      interpolation: {
        escapeValue: false, 
      },
      react: {
        useSuspense: false, 
      },
      
      initImmediate: true,
    });

  i18n.on('languageChanged', handleLanguageChanged);
  
  isInitialized = true;
  
  if (__DEV__) {
    console.log(`[i18n] Initialized with bundled translations (language: ${currentLanguage})`);
  }
}

async function enhanceTranslations(): Promise<void> {
  try {
    
    const meta = await getCachedMeta();
    const versions = meta?.versions[currentLanguage];
    
    
    for (const namespace of I18N_CONFIG.namespaces) {
      const version = versions?.[namespace];
      const result = await loadAndMergeTranslation(currentLanguage, namespace, version);
      
      if (result.success && result.data) {
        
        i18n.addResourceBundle(
          currentLanguage,
          namespace,
          result.data,
          true, 
          true  
        );
      }
    }
    
    
    i18n.emit('languageChanged', currentLanguage);
    
    if (__DEV__) {
      console.log(`[i18n] Enhanced translations for: ${currentLanguage}`);
    }
  } catch (error) {
    logError(error, 'enhanceTranslations');
    
  }
}

export async function initializeI18n(): Promise<void> {
  
  if (isInitialized && initializationPromise) {
    return initializationPromise;
  }
  
  if (isInitialized) {
    return Promise.resolve();
  }
  
  
  initializationPromise = (async () => {
    try {
      
      const initialLanguage = await determineInitialLanguage();
      initializeWithBundled(initialLanguage);
      
      
      const detection = await detectLanguage();
      const detectedLanguage = normalizeLanguage(detection.language);
      if (detectedLanguage !== currentLanguage) {
        currentLanguage = detectedLanguage;
        await i18n.changeLanguage(detectedLanguage);
        await saveLanguage(detectedLanguage);
      }
      
      
      
      void enhanceTranslations();
      
      
      startUpdateChecker(() => currentLanguage);
      
      if (__DEV__) {
        console.log(`[i18n] Initialization complete (language: ${currentLanguage})`);
      }
    } catch (error) {
      logError(error, 'initializeI18n');
      
    }
  })();
  
  return initializationPromise;
}

export async function changeLanguage(language: SupportedLanguage): Promise<void> {
  const normalized = normalizeLanguage(language);

  if (!I18N_CONFIG.supportedLanguages.includes(normalized)) {
    return;
  }

  if (normalized === currentLanguage) {
    return;
  }

  currentLanguage = normalized;

  try {
    
    await i18n.changeLanguage(normalized);
    
    
    await saveLanguage(normalized);
    
    
    void enhanceTranslations();
    
    if (__DEV__) {
      console.log(`[i18n] Language changed to: ${normalized}`);
    }
  } catch (error) {
    logError(error, 'changeLanguage', { language: normalized });
    throw error;
  }
}

export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

export async function waitForI18n(): Promise<void> {
  if (!isInitialized) {
    await initializeI18n();
  }
  
  
  
  await Promise.race([
    enhanceTranslations(),
    new Promise(resolve => setTimeout(resolve, 100)),
  ]);
}

export function cleanup(): void {
  i18n.off('languageChanged', handleLanguageChanged);
  stopUpdateChecker();
  isInitialized = false;
  initializationPromise = null;
}

void initializeI18n();

export { i18n };

export { useTranslation } from './hooks/useTranslation';
export { useLanguage } from './hooks/useLanguage';

export type { SupportedLanguage, Namespace } from './config';
export type { TranslationData, I18nState, LanguageDetectionResult } from './types';

export default i18n;

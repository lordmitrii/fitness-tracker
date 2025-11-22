

import * as Localization from 'expo-localization';
import { I18N_CONFIG, type SupportedLanguage } from '../config';
import type { LanguageDetectionResult } from '../Types';
import { getSavedLanguage } from '../storage/preferences';

function getDeviceLanguage(): SupportedLanguage {
  try {
    const locales = Localization.getLocales();
    
    if (locales && locales.length > 0) {
      const locale = locales[0];
      const languageCode = locale.languageCode?.toLowerCase();
      
      if (!languageCode) {
        return I18N_CONFIG.defaultLanguage;
      }
      
      
      if (I18N_CONFIG.supportedLanguages.includes(languageCode as SupportedLanguage)) {
        return languageCode as SupportedLanguage;
      }
      
      
      const baseLanguage = languageCode.split('-')[0] as SupportedLanguage;
      if (I18N_CONFIG.supportedLanguages.includes(baseLanguage)) {
        return baseLanguage;
      }
    }
  } catch (error) {
    console.warn('[i18n] Failed to detect device language:', error);
  }
  
  return I18N_CONFIG.defaultLanguage;
}

export async function detectLanguage(): Promise<LanguageDetectionResult> {
  
  const savedLanguage = await getSavedLanguage();
  if (savedLanguage) {
    return {
      language: savedLanguage,
      confidence: 'high',
      source: 'user_preference',
    };
  }
  
  
  const deviceLanguage = getDeviceLanguage();
  return {
    language: deviceLanguage,
    confidence: deviceLanguage !== I18N_CONFIG.defaultLanguage ? 'medium' : 'low',
    source: 'device',
  };
}

export function getDeviceLanguageSync(): SupportedLanguage {
  return getDeviceLanguage();
}



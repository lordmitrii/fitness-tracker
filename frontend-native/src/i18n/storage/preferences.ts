

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { I18N_CONFIG, type SupportedLanguage } from '../config';
import { CacheError } from '../types';
import { logError, safeExecute } from '../utils/errors';

const LANGUAGE_KEY = I18N_CONFIG.cache.languageKey;

const isAsyncStorageAvailable = Platform.OS !== 'web' || typeof window !== 'undefined';

export async function getSavedLanguage(): Promise<SupportedLanguage | null> {
  if (!isAsyncStorageAvailable) {
    return null;
  }
  
  return safeExecute(
    async () => {
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (!saved) {
        return null;
      }
      
      
      if (I18N_CONFIG.supportedLanguages.includes(saved as SupportedLanguage)) {
        return saved as SupportedLanguage;
      }
      
      
      await AsyncStorage.removeItem(LANGUAGE_KEY);
      return null;
    },
    null,
    'getSavedLanguage'
  );
}

export async function saveLanguage(language: SupportedLanguage): Promise<void> {
  if (!isAsyncStorageAvailable) {
    return;
  }
  
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    logError(error, 'saveLanguage', { language });
    throw new CacheError('Failed to save language preference', error as Error);
  }
}

export async function clearSavedLanguage(): Promise<void> {
  if (!isAsyncStorageAvailable) {
    return;
  }
  
  try {
    await AsyncStorage.removeItem(LANGUAGE_KEY);
  } catch (error) {
    logError(error, 'clearSavedLanguage');
    
  }
}


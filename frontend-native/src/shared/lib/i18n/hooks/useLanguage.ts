

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SupportedLanguage, LanguageDetectionResult } from '../Types';
import { detectLanguage, getDeviceLanguageSync } from '../detection/language';
import { saveLanguage, getSavedLanguage } from '../storage/preferences';
import { preloadLanguage } from '../loading/manager';
import { logError } from '../utils/Errors';

export interface UseLanguageReturn {
  
  language: SupportedLanguage;
  
  
  changeLanguage: (language: SupportedLanguage) => Promise<void>;
  
  
  detectAndSetLanguage: () => Promise<void>;
  
  
  resetToDeviceLanguage: () => Promise<void>;
  
  
  isChanging: boolean;
  
  
  error: Error | null;
}

export function useLanguage(): UseLanguageReturn {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const currentLanguage = (i18n.language?.split('-')[0] || 'en') as SupportedLanguage;
  
  

  const changeLanguage = useCallback(async (language: SupportedLanguage) => {
    if (language === currentLanguage) {
      return; 
    }
    
    setIsChanging(true);
    setError(null);
    
    try {
      
      await preloadLanguage(language);
      
      
      await i18n.changeLanguage(language);
      
      
      await saveLanguage(language);
      
      if (__DEV__) {
        console.log(`[i18n] Language changed to: ${language}`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to change language');
      logError(error, 'useLanguage - changeLanguage', { language });
      setError(error);
      throw error;
    } finally {
      setIsChanging(false);
    }
  }, [i18n, currentLanguage]);
  
  

  const detectAndSetLanguage = useCallback(async () => {
    setIsChanging(true);
    setError(null);
    
    try {
      const detection = await detectLanguage();
      await changeLanguage(detection.language);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to detect language');
      logError(error, 'useLanguage - detectAndSetLanguage');
      setError(error);
    } finally {
      setIsChanging(false);
    }
  }, [changeLanguage]);
  
  

  const resetToDeviceLanguage = useCallback(async () => {
    const deviceLanguage = getDeviceLanguageSync();
    await changeLanguage(deviceLanguage);
  }, [changeLanguage]);
  
  return {
    language: currentLanguage,
    changeLanguage,
    detectAndSetLanguage,
    resetToDeviceLanguage,
    isChanging,
    error,
  };
}



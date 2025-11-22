

import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { I18N_CONFIG, type SupportedLanguage, type Namespace } from '../config';
import { TranslationNotFoundError } from '../Types';
import { logError } from '../utils/Errors';
import { getTranslationValue } from '../utils/Validation';
import { loadBundledTranslation } from '../loading/bundled';

export interface EnhancedTFunction {
  (key: string, options?: any): string;
  exists: (key: string) => boolean;
}

export function useTranslation(namespace?: string) {
  const { t: originalT, i18n, ready } = useI18nextTranslation(namespace);
  
  
  const t = useMemo(() => {
    const enhancedT = ((key: string, options?: any) => {
      try {
        const result = originalT(key, options);
        
        
        if (result === key && !key.includes('{{')) {
          
          if (I18N_CONFIG.dev.logMissingKeys) {
            console.warn(`[i18n] Missing translation key: ${key} (language: ${i18n.language})`);
          }
          
          
          try {
            const currentLanguage = (i18n.language?.split('-')[0] || 'en') as SupportedLanguage;
            const currentNamespace = (namespace || I18N_CONFIG.defaultNamespace) as Namespace;
            const bundled = loadBundledTranslation(currentLanguage, currentNamespace);
            const bundledValue = getTranslationValue(bundled, key);
            
            if (bundledValue) {
              return bundledValue;
            }
          } catch (error) {
            
          }
          
          
          return key;
        }
        
        return result;
      } catch (error) {
        logError(error, 'useTranslation - translation error', { key, language: i18n.language });
        return key;
      }
    }) as EnhancedTFunction;
    
    
    enhancedT.exists = (key: string) => {
      return originalT(key, { returnObjects: false }) !== key;
    };
    
    return enhancedT;
  }, [originalT, i18n, namespace]);
  
  return {
    t,
    i18n,
    ready,
  };
}

export { useTranslation as default };



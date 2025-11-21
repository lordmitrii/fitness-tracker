

import type { TranslationData } from '../types';
import { ValidationError } from '../types';

export function validateTranslationData(data: unknown): data is TranslationData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  
  if (Array.isArray(data)) {
    return false;
  }
  
  
  for (const value of Object.values(data)) {
    if (typeof value !== 'string' && typeof value !== 'object') {
      return false;
    }
    
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (!validateTranslationData(value)) {
        return false;
      }
    }
  }
  
  return true;
}

export function validateAndSanitize(data: unknown): TranslationData {
  if (!validateTranslationData(data)) {
    throw new ValidationError(
      'Invalid translation data structure. Expected object with string or nested object values.',
      data
    );
  }
  
  
  return JSON.parse(JSON.stringify(data)) as TranslationData;
}

export function hasTranslationKey(
  data: TranslationData,
  key: string
): boolean {
  const keys = key.split('.');
  let current: TranslationData | string = data;
  
  for (const k of keys) {
    if (typeof current === 'string') {
      return false;
    }
    
    if (!(k in current)) {
      return false;
    }
    
    current = current[k];
  }
  
  return typeof current === 'string';
}

export function getTranslationValue(
  data: TranslationData,
  key: string
): string | undefined {
  const keys = key.split('.');
  let current: TranslationData | string = data;
  
  for (const k of keys) {
    if (typeof current === 'string') {
      return undefined;
    }
    
    if (!(k in current)) {
      return undefined;
    }
    
    current = current[k];
  }
  
  return typeof current === 'string' ? current : undefined;
}

export function mergeTranslations(
  ...sources: TranslationData[]
): TranslationData {
  const result: TranslationData = {};
  
  for (const source of sources) {
    deepMerge(result, source);
  }
  
  return result;
}

function deepMerge(target: TranslationData, source: TranslationData): void {
  for (const key in source) {
    if (key in source) {
      const sourceValue = source[key];
      const targetValue = target[key];
      
      if (typeof sourceValue === 'string') {
        
        target[key] = sourceValue;
      } else if (typeof sourceValue === 'object' && sourceValue !== null) {
        
        if (typeof targetValue === 'object' && targetValue !== null && typeof targetValue !== 'string') {
          deepMerge(targetValue as TranslationData, sourceValue);
        } else {
          target[key] = { ...sourceValue };
        }
      }
    }
  }
}


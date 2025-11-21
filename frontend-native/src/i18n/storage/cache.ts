

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { I18N_CONFIG, type SupportedLanguage, type Namespace } from '../config';
import type { TranslationData, TranslationMeta, CacheEntry } from '../types';
import { CacheError } from '../types';
import { logError, safeExecute } from '../utils/errors';
import { validateAndSanitize } from '../utils/validation';

const isAsyncStorageAvailable = Platform.OS !== 'web' || typeof window !== 'undefined';
const CACHE_PREFIX = I18N_CONFIG.cache.translationPrefix;
const META_KEY = I18N_CONFIG.cache.metaKey;
const ETAG_KEY = I18N_CONFIG.cache.etagKey;
const EXPIRATION_MS = I18N_CONFIG.cache.expirationDays * 24 * 60 * 60 * 1000;

function getCacheKey(language: SupportedLanguage, namespace: Namespace): string {
  return `${CACHE_PREFIX}${language}|${namespace}`;
}

function getVersionKey(language: SupportedLanguage, namespace: Namespace): string {
  return `${CACHE_PREFIX}${language}|${namespace}|version`;
}

function getTimestampKey(language: SupportedLanguage, namespace: Namespace): string {
  return `${CACHE_PREFIX}${language}|${namespace}|timestamp`;
}

function getEtagKey(language: SupportedLanguage, namespace: Namespace): string {
  return `${CACHE_PREFIX}${language}|${namespace}|etag`;
}

export async function getCachedTranslation(
  language: SupportedLanguage,
  namespace: Namespace,
  expectedVersion?: string
): Promise<CacheEntry | null> {
  if (!isAsyncStorageAvailable) {
    return null;
  }
  
  return safeExecute(
    async () => {
      const keys = [
        getCacheKey(language, namespace),
        getVersionKey(language, namespace),
        getTimestampKey(language, namespace),
        getEtagKey(language, namespace),
      ];
      
      const results = await AsyncStorage.multiGet(keys);
      const [[, data], [, version], [, timestamp], [, etag]] = results;
      
      
      if (!data || !version || !timestamp) {
        return null;
      }
      
      
      const cacheTimestamp = parseInt(timestamp, 10);
      if (isNaN(cacheTimestamp) || Date.now() > cacheTimestamp + EXPIRATION_MS) {
        
        await AsyncStorage.multiRemove(keys);
        return null;
      }
      
      
      if (expectedVersion && version !== expectedVersion) {
        
        await AsyncStorage.multiRemove(keys);
        return null;
      }
      
      
      let parsedData: TranslationData;
      try {
        parsedData = JSON.parse(data);
        validateAndSanitize(parsedData);
      } catch (error) {
        
        await AsyncStorage.multiRemove(keys);
        logError(error, 'getCachedTranslation - invalid data', { language, namespace });
        return null;
      }
      
      return {
        data: parsedData,
        version,
        timestamp: cacheTimestamp,
        etag: etag || undefined,
      };
    },
    null,
    'getCachedTranslation'
  );
}

export async function saveCachedTranslation(
  language: SupportedLanguage,
  namespace: Namespace,
  data: TranslationData,
  version: string,
  etag?: string
): Promise<void> {
  if (!isAsyncStorageAvailable) {
    return;
  }
  
  try {
    
    const validatedData = validateAndSanitize(data);
    
    const timestamp = Date.now();
    const entries: [string, string][] = [
      [getCacheKey(language, namespace), JSON.stringify(validatedData)],
      [getVersionKey(language, namespace), version],
      [getTimestampKey(language, namespace), timestamp.toString()],
    ];
    
    if (etag) {
      entries.push([getEtagKey(language, namespace), etag]);
    }
    
    await AsyncStorage.multiSet(entries);
    
    if (I18N_CONFIG.dev.logCacheHits) {
      console.log(`[i18n] Cached translation: ${language}/${namespace} v${version}`);
    }
  } catch (error) {
    logError(error, 'saveCachedTranslation', { language, namespace, version });
    throw new CacheError('Failed to save translation cache', error as Error);
  }
}

export async function clearCachedTranslation(
  language: SupportedLanguage,
  namespace: Namespace
): Promise<void> {
  if (!isAsyncStorageAvailable) {
    return;
  }
  
  try {
    const keys = [
      getCacheKey(language, namespace),
      getVersionKey(language, namespace),
      getTimestampKey(language, namespace),
      getEtagKey(language, namespace),
    ];
    
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    logError(error, 'clearCachedTranslation', { language, namespace });
    
  }
}

export async function clearAllCachedTranslations(): Promise<void> {
  if (!isAsyncStorageAvailable) {
    return;
  }
  
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    logError(error, 'clearAllCachedTranslations');
    
  }
}

export async function getCachedMeta(): Promise<TranslationMeta | null> {
  if (!isAsyncStorageAvailable) {
    return null;
  }
  
  return safeExecute(
    async () => {
      const [metaStr, etag] = await AsyncStorage.multiGet([META_KEY, ETAG_KEY]);
      const [, metaData] = metaStr;
      const [, etagData] = etag;
      
      if (!metaData) {
        return null;
      }
      
      try {
        const meta = JSON.parse(metaData);
        return {
          versions: meta.versions || {},
          etag: etagData || undefined,
        };
      } catch (error) {
        logError(error, 'getCachedMeta - invalid data');
        return null;
      }
    },
    null,
    'getCachedMeta'
  );
}

export async function saveCachedMeta(meta: TranslationMeta): Promise<void> {
  if (!isAsyncStorageAvailable) {
    return;
  }
  
  try {
    const entries: [string, string][] = [
      [META_KEY, JSON.stringify({ versions: meta.versions })],
    ];
    
    if (meta.etag) {
      entries.push([ETAG_KEY, meta.etag]);
    }
    
    await AsyncStorage.multiSet(entries);
  } catch (error) {
    logError(error, 'saveCachedMeta');
    throw new CacheError('Failed to save metadata cache', error as Error);
  }
}

export async function clearCachedMeta(): Promise<void> {
  if (!isAsyncStorageAvailable) {
    return;
  }
  
  try {
    await AsyncStorage.multiRemove([META_KEY, ETAG_KEY]);
  } catch (error) {
    logError(error, 'clearCachedMeta');
    
  }
}


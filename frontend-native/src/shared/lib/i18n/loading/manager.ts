

import { I18N_CONFIG, type SupportedLanguage, type Namespace } from '../config';
import type { TranslationData, TranslationLoadResult } from '../Types';
import { NetworkError } from '../Types';
import { logError } from '../utils/Errors';
import { mergeTranslations } from '../utils/Validation';
import { getCachedTranslation, saveCachedTranslation } from '../storage/cache';
import { loadBundledTranslation } from './bundled';
import { loadRemoteTranslation } from './remote';

export async function loadTranslation(
  language: SupportedLanguage,
  namespace: Namespace = I18N_CONFIG.defaultNamespace,
  expectedVersion?: string
): Promise<TranslationLoadResult> {
  let cachedData: TranslationData | null = null;
  let remoteData: TranslationData | null = null;
  let bundledData: TranslationData | null = null;
  
  
  try {
    const cacheEntry = await getCachedTranslation(language, namespace, expectedVersion);
    if (cacheEntry) {
      cachedData = cacheEntry.data;
      
      if (I18N_CONFIG.dev.logCacheHits) {
        console.log(`[i18n] Cache hit: ${language}/${namespace} v${cacheEntry.version}`);
      }
      
      
      
      return {
        success: true,
        data: cachedData,
        source: 'cache',
        fromCache: true,
      };
    }
  } catch (error) {
    logError(error, 'loadTranslation - cache read', { language, namespace });
    
  }
  
  
  try {
    const cacheEntry = await getCachedTranslation(language, namespace);
    const etag = cacheEntry?.etag;
    
    const remoteResult = await loadRemoteTranslation(language, namespace, etag);
    remoteData = remoteResult.data;
    
    
    if (remoteResult.etag && expectedVersion) {
      await saveCachedTranslation(
        language,
        namespace,
        remoteData,
        expectedVersion,
        remoteResult.etag
      );
    }
    
    return {
      success: true,
      data: remoteData,
      source: 'remote',
      fromCache: false,
    };
  } catch (error) {
    
    if (error instanceof NetworkError) {
      
      if (error.message.includes('304')) {
        
        if (cachedData) {
          return {
            success: true,
            data: cachedData,
            source: 'cache',
            fromCache: true,
          };
        }
      }
      
      
      logError(error, 'loadTranslation - remote failed', { language, namespace });
    } else {
      logError(error, 'loadTranslation - remote error', { language, namespace });
    }
    
  }
  
  
  try {
    bundledData = loadBundledTranslation(language, namespace);
    
    return {
      success: true,
      data: bundledData,
      source: 'bundled',
      fromCache: false,
    };
  } catch (error) {
    logError(error, 'loadTranslation - bundled failed', { language, namespace });
    
    
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
      source: 'bundled',
      fromCache: false,
    };
  }
}

export async function loadAndMergeTranslation(
  language: SupportedLanguage,
  namespace: Namespace = I18N_CONFIG.defaultNamespace,
  expectedVersion?: string
): Promise<TranslationLoadResult> {
  const sources: TranslationData[] = [];
  
  
  const bundledData = loadBundledTranslation(language, namespace);
  sources.push(bundledData);
  
  
  try {
    const cacheEntry = await getCachedTranslation(language, namespace, expectedVersion);
    if (cacheEntry) {
      sources.push(cacheEntry.data);
    }
  } catch (error) {
    
  }
  
  
  try {
    const cacheEntry = await getCachedTranslation(language, namespace);
    const etag = cacheEntry?.etag;
    
    const remoteResult = await loadRemoteTranslation(language, namespace, etag);
    sources.push(remoteResult.data);
    
    
    if (remoteResult.etag && expectedVersion) {
      await saveCachedTranslation(
        language,
        namespace,
        remoteResult.data,
        expectedVersion,
        remoteResult.etag
      );
    }
  } catch (error) {
    
    if (!(error instanceof NetworkError && error.message.includes('304'))) {
      logError(error, 'loadAndMergeTranslation - remote failed', { language, namespace });
    }
  }
  
  
  const mergedData = mergeTranslations(...sources);
  
  return {
    success: true,
    data: mergedData,
    source: 'bundled', 
    fromCache: false,
  };
}

export async function preloadLanguage(
  language: SupportedLanguage,
  expectedVersions?: Record<Namespace, string>
): Promise<Record<Namespace, TranslationLoadResult>> {
  const results: Record<Namespace, TranslationLoadResult> = {} as any;
  
  const promises = I18N_CONFIG.namespaces.map(async (namespace) => {
    const version = expectedVersions?.[namespace];
    const result = await loadTranslation(language, namespace, version);
    results[namespace] = result;
    return result;
  });
  
  await Promise.allSettled(promises);
  
  return results;
}



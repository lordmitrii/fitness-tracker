

import { I18N_CONFIG, type SupportedLanguage, type Namespace } from '../config';
import type { TranslationData, NetworkRequestOptions } from '../types';
import { NetworkError } from '../types';
import { logError, retryWithBackoff } from '../utils/errors';
import { validateAndSanitize } from '../utils/validation';
import api from '../../api';

async function fetchTranslation(
  language: SupportedLanguage,
  namespace: Namespace,
  etag?: string,
  options?: NetworkRequestOptions
): Promise<{ data: TranslationData; etag?: string }> {
  const url = `${I18N_CONFIG.network.baseUrl}/${language}/${namespace}`;
  const timeout = options?.timeout ?? I18N_CONFIG.network.timeout;
  const retryAttempts = options?.retryAttempts ?? I18N_CONFIG.network.retryAttempts;
  const retryDelay = options?.retryDelay ?? I18N_CONFIG.network.retryDelay;
  
  const headers: Record<string, string> = {
    ...options?.headers,
  };
  
  if (etag) {
    headers['If-None-Match'] = etag;
  }
  
  if (I18N_CONFIG.dev.logNetworkRequests) {
    console.log(`[i18n] Fetching translation: ${url}`, { etag, headers });
  }
  
  try {
    const response = await retryWithBackoff(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const res = await api.get(url, {
            headers,
            signal: controller.signal,
            validateStatus: (status) => status >= 200 && status < 300 || status === 304,
          });
          
          clearTimeout(timeoutId);
          
          
          if (res.status === 304) {
            throw new NetworkError('Translation not modified (304)', undefined);
          }
          
          return res;
        } catch (error: any) {
          clearTimeout(timeoutId);
          
          
          if (error?.isOffline || error?.message?.includes('Offline')) {
            throw new NetworkError('Device is offline', error);
          }
          
          
          if (error?.code === 'ECONNABORTED' || error?.name === 'AbortError') {
            throw new NetworkError('Request timeout', error);
          }
          
          throw error;
        }
      },
      retryAttempts,
      retryDelay,
      `fetchTranslation(${language}/${namespace})`
    );
    
    const responseEtag = response.headers?.['etag'] || response.headers?.['ETag'];
    const data = response.data;
    
    
    const validatedData = validateAndSanitize(data);
    
    if (I18N_CONFIG.dev.logNetworkRequests) {
      console.log(`[i18n] Fetched translation: ${url}`, { 
        etag: responseEtag,
        keys: Object.keys(validatedData).length 
      });
    }
    
    return {
      data: validatedData,
      etag: responseEtag,
    };
  } catch (error: any) {
    
    if (error instanceof NetworkError && error.message.includes('304')) {
      throw error;
    }
    
    logError(error, 'fetchTranslation', { language, namespace, url });
    
    
    if (error instanceof NetworkError) {
      throw error;
    }
    
    throw new NetworkError(
      `Failed to fetch translation: ${language}/${namespace}`,
      error
    );
  }
}

export async function loadRemoteTranslation(
  language: SupportedLanguage,
  namespace: Namespace = I18N_CONFIG.defaultNamespace,
  etag?: string,
  options?: NetworkRequestOptions
): Promise<{ data: TranslationData; etag?: string }> {
  return fetchTranslation(language, namespace, etag, options);
}

export async function fetchTranslationMeta(): Promise<{
  versions: Record<SupportedLanguage, Record<Namespace, string>>;
  etag?: string;
}> {
  const url = `${I18N_CONFIG.network.baseUrl}/meta`;
  const params = new URLSearchParams({
    locales: I18N_CONFIG.supportedLanguages.join(','),
    namespaces: I18N_CONFIG.namespaces.join(','),
  });
  
  const fullUrl = `${url}?${params.toString()}`;
  
  if (I18N_CONFIG.dev.logNetworkRequests) {
    console.log(`[i18n] Fetching translation meta: ${fullUrl}`);
  }
  
  try {
    const response = await api.get(fullUrl, {
      headers: {
        'Cache-Control': 'no-cache',
      },
      timeout: I18N_CONFIG.network.timeout,
      validateStatus: (status) => status >= 200 && status < 300 || status === 304,
    });
    
    
    if (response.status === 304) {
      throw new NetworkError('Meta not modified (304)', undefined);
    }
    
    const etag = response.headers?.['etag'] || response.headers?.['ETag'];
    const versions = response.data?.versions || {};
    
    if (I18N_CONFIG.dev.logNetworkRequests) {
      console.log(`[i18n] Fetched translation meta`, { etag, versions });
    }
    
    return {
      versions,
      etag,
    };
  } catch (error: any) {
    
    if (error instanceof NetworkError && error.message.includes('304')) {
      throw error;
    }
    
    
    if (error?.isOffline || error?.message?.includes('Offline')) {
      throw new NetworkError('Device is offline', error);
    }
    
    logError(error, 'fetchTranslationMeta');
    throw new NetworkError('Failed to fetch translation metadata', error);
  }
}


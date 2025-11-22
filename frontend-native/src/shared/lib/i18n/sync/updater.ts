

import NetInfo from '@react-native-community/netinfo';
import { I18N_CONFIG, type SupportedLanguage, type Namespace } from '../config';
import type { TranslationMeta } from '../Types';
import { NetworkError } from '../Types';
import { logError } from '../utils/Errors';
import { getCachedMeta, saveCachedMeta, getCachedTranslation } from '../storage/cache';
import { fetchTranslationMeta, loadRemoteTranslation } from '../loading/remote';
import { saveCachedTranslation } from '../storage/cache';

let updateCheckInterval: ReturnType<typeof setInterval> | null = null;
let isUpdating = false;

async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    
    
    if (state.isConnected) {
      return state.isInternetReachable !== false; 
    }
    return false;
  } catch {
    
    return true;
  }
}

export async function checkAndUpdateTranslations(
  currentLanguage: SupportedLanguage
): Promise<boolean> {
  
  if (isUpdating) {
    return false;
  }
  
  
  const online = await isOnline();
  if (!online) {
    
    return false;
  }
  
  isUpdating = true;
  
  try {
    
    const cachedMeta = await getCachedMeta();
    const cachedEtag = cachedMeta?.etag;
    
    
    let newMeta: TranslationMeta;
    try {
      const metaResult = await fetchTranslationMeta();
      newMeta = {
        versions: metaResult.versions,
        etag: metaResult.etag,
      };
    } catch (error) {
      
      if (error instanceof NetworkError && error.message.includes('304')) {
        if (I18N_CONFIG.dev.verbose) {
          console.log('[i18n] Translations up to date (304)');
        }
        return false;
      }
      
      
      
      if (error instanceof NetworkError) {
        
        return false;
      }
      
      throw error;
    }
    
    
    const hasChanges = !cachedMeta || 
      JSON.stringify(cachedMeta.versions) !== JSON.stringify(newMeta.versions);
    
    if (!hasChanges) {
      
      if (newMeta.etag && newMeta.etag !== cachedEtag) {
        await saveCachedMeta(newMeta);
      }
      return false;
    }
    
    
    await saveCachedMeta(newMeta);
    
    
    const languageVersions = newMeta.versions[currentLanguage];
    if (!languageVersions) {
      return false;
    }
    
    
    const updatePromises = I18N_CONFIG.namespaces.map(async (namespace) => {
      const newVersion = languageVersions[namespace];
      if (!newVersion) {
        return;
      }
      
      
      const cachedMeta = await getCachedMeta();
      const cachedVersion = cachedMeta?.versions[currentLanguage]?.[namespace];
      
      if (cachedVersion === newVersion) {
        
        return;
      }
      
      try {
        
        const result = await loadRemoteTranslation(currentLanguage, namespace);
        
        
        await saveCachedTranslation(
          currentLanguage,
          namespace,
          result.data,
          newVersion,
          result.etag
        );
        
        if (I18N_CONFIG.dev.verbose) {
          console.log(
            `[i18n] Updated translation: ${currentLanguage}/${namespace} v${newVersion}`
          );
        }
      } catch (error) {
        
        logError(
          error,
          'checkAndUpdateTranslations - update failed',
          { language: currentLanguage, namespace }
        );
      }
    });
    
    await Promise.allSettled(updatePromises);
    
    return true;
  } catch (error) {
    logError(error, 'checkAndUpdateTranslations');
    return false;
  } finally {
    isUpdating = false;
  }
}

export function startUpdateChecker(
  getCurrentLanguage: () => SupportedLanguage,
  interval: number = I18N_CONFIG.network.updateCheckInterval
): void {
  
  stopUpdateChecker();
  
  
  void checkAndUpdateTranslations(getCurrentLanguage());
  
  
  updateCheckInterval = setInterval(() => {
    void checkAndUpdateTranslations(getCurrentLanguage());
  }, interval);
  
  if (I18N_CONFIG.dev.verbose) {
    console.log(`[i18n] Started update checker (interval: ${interval}ms)`);
  }
}

export function stopUpdateChecker(): void {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
    
    if (I18N_CONFIG.dev.verbose) {
      console.log('[i18n] Stopped update checker');
    }
  }
}

export async function forceUpdateCheck(
  currentLanguage: SupportedLanguage
): Promise<boolean> {
  return checkAndUpdateTranslations(currentLanguage);
}


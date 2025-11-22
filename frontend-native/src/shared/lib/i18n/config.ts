

export const I18N_CONFIG = {
  
  supportedLanguages: ['en', 'ru', 'zh'] as const,
  
  
  defaultLanguage: 'en' as const,
  
  
  namespaces: ['translation'] as const,
  defaultNamespace: 'translation' as const,
  
  
  cache: {
    
    expirationDays: 7,
    
    
    versionKey: 'i18n_cache_version',
    metaKey: 'i18n_meta',
    etagKey: 'i18n_etag',
    languageKey: 'i18n_language',
    missingKeysKey: 'i18n_missing_keys',
    
    
    translationPrefix: 'i18n_translation_',
  },
  
  
  network: {
    
    baseUrl: '/i18n',
    
    
    timeout: 5000,
    
    
    retryAttempts: 3,
    retryDelay: 1000, 
    
    
    updateCheckInterval: 5 * 60 * 1000,
  },
  
  
  dev: {
    
    logMissingKeys: __DEV__,
    
    
    logCacheHits: false,
    
    
    logNetworkRequests: false,
    
    
    verbose: false,
  },
} as const;

export type SupportedLanguage = typeof I18N_CONFIG.supportedLanguages[number];
export type Namespace = typeof I18N_CONFIG.namespaces[number];



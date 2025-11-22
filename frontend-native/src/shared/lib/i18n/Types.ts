

import type { SupportedLanguage, Namespace } from './config';

export type { SupportedLanguage, Namespace };

export interface TranslationData {
  [key: string]: string | TranslationData;
}

export interface TranslationCache {
  language: SupportedLanguage;
  namespace: Namespace;
  data: TranslationData;
  version: string;
  timestamp: number;
  etag?: string;
}

export interface TranslationMeta {
  versions: Record<SupportedLanguage, Record<Namespace, string>>;
  etag?: string;
}

export interface I18nState {
  language: SupportedLanguage;
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: 'high' | 'medium' | 'low';
  source: 'user_preference' | 'device' | 'default';
}

export interface TranslationLoadResult {
  success: boolean;
  data?: TranslationData;
  source?: 'bundled' | 'cache' | 'remote';
  error?: Error;
  fromCache?: boolean;
}

export interface CacheEntry {
  data: TranslationData;
  version: string;
  timestamp: number;
  etag?: string;
}

export interface NetworkRequestOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export class I18nError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'I18nError';
  }
}

export class TranslationNotFoundError extends I18nError {
  constructor(
    language: SupportedLanguage,
    namespace: Namespace,
    key?: string
  ) {
    const keyMsg = key ? ` (key: ${key})` : '';
    super(
      `Translation not found: ${language}/${namespace}${keyMsg}`,
      'TRANSLATION_NOT_FOUND'
    );
    this.name = 'TranslationNotFoundError';
  }
}

export class NetworkError extends I18nError {
  constructor(message: string, originalError?: Error) {
    super(message, 'NETWORK_ERROR', originalError);
    this.name = 'NetworkError';
  }
}

export class CacheError extends I18nError {
  constructor(message: string, originalError?: Error) {
    super(message, 'CACHE_ERROR', originalError);
    this.name = 'CacheError';
  }
}

export class ValidationError extends I18nError {
  constructor(message: string, public data?: unknown) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}



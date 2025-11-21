

import type { I18nError, NetworkError, CacheError, ValidationError } from '../types';

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof Error && 
    (error.name === 'NetworkError' || 
     'code' in error && (error as any).code === 'NETWORK_ERROR' ||
     'isOffline' in error);
}

export function isCacheError(error: unknown): error is CacheError {
  return error instanceof Error && 
    (error.name === 'CacheError' || 
     'code' in error && (error as any).code === 'CACHE_ERROR');
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof Error && 
    (error.name === 'ValidationError' || 
     'code' in error && (error as any).code === 'VALIDATION_ERROR');
}

export function isI18nError(error: unknown): error is I18nError {
  return error instanceof Error && 
    (error.name === 'I18nError' || 
     error.name === 'TranslationNotFoundError' ||
     error.name === 'NetworkError' ||
     error.name === 'CacheError' ||
     error.name === 'ValidationError');
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Network error. Using cached translations.';
  }
  
  if (isCacheError(error)) {
    return 'Cache error. Using bundled translations.';
  }
  
  if (isValidationError(error)) {
    return 'Translation validation failed. Using fallback.';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred.';
}

export function logError(
  error: unknown,
  context: string,
  additionalData?: Record<string, unknown>
): void {
  
  if (isNetworkError(error) && error.message.includes('offline')) {
    return;
  }
  
  if (!__DEV__) {
    
    return;
  }
  
  const errorInfo: Record<string, unknown> = {
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    ...additionalData,
  };
  
  console.error(`[i18n] ${context}:`, errorInfo);
}

export async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000,
  context: string = 'retry'
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      
      if (isValidationError(error)) {
        throw error;
      }
      
      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        logError(error, `${context} (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logError(lastError, `${context} (failed after ${maxAttempts} attempts)`);
  throw lastError;
}


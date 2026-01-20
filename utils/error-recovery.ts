/**
 * Error recovery and offline support utilities
 * Provides graceful degradation and retry mechanisms
 */

import { KaraokeSignup } from '@/types/karaoke';

// Error types for better error handling
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  SERVER_ERROR = 'server_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  AUTH_ERROR = 'auth_error',
  OFFLINE_ERROR = 'offline_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export interface ErrorRecoveryResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    type: ErrorType;
    message: string;
    originalError?: any;
    retryable: boolean;
    userMessage: string;
  };
}

// Default retry options
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, 5xx server errors, and rate limits
    if (!error) return false;

    if (error.name === 'NetworkError' || error.message?.includes('fetch')) return true;
    if (error.status >= 500 && error.status < 600) return true;
    if (error.status === 429) return true; // Rate limited
    if (error.code === 'PGRST301') return true; // Supabase connection issues

    return false;
  }
};

/**
 * Generic retry function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<ErrorRecoveryResult<T>> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await operation();

      // Success on any attempt
      return { success: true, data: result };
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === opts.maxRetries) break;

      // Check if we should retry this error
      if (!opts.retryCondition(error)) break;

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay;
      const totalDelay = delay + jitter;

      console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries + 1} in ${Math.round(totalDelay)}ms:`, (error as any)?.message || 'Unknown error');

      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: {
      type: classifyError(lastError),
      message: lastError?.message || 'Operation failed after retries',
      originalError: lastError,
      retryable: false,
      userMessage: getUserFriendlyMessage(lastError)
    }
  };
}

/**
 * Classify error type for better handling
 */
function classifyError(error: any): ErrorType {
  if (!error) return ErrorType.UNKNOWN_ERROR;

  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('fetch') || error.code === 'NETWORK_ERROR') {
    return ErrorType.NETWORK_ERROR;
  }

  // HTTP status codes
  if (error.status) {
    if (error.status === 401 || error.status === 403) return ErrorType.AUTH_ERROR;
    if (error.status === 429) return ErrorType.RATE_LIMIT_ERROR;
    if (error.status >= 400 && error.status < 500) return ErrorType.VALIDATION_ERROR;
    if (error.status >= 500) return ErrorType.SERVER_ERROR;
  }

  // Supabase specific errors
  if (error.code === 'PGRST301' || error.message?.includes('connection')) {
    return ErrorType.NETWORK_ERROR;
  }

  // Stripe errors
  if (error.type?.startsWith('Stripe')) {
    return ErrorType.SERVER_ERROR;
  }

  return ErrorType.UNKNOWN_ERROR;
}

/**
 * Convert technical errors to user-friendly messages
 */
function getUserFriendlyMessage(error: any): string {
  if (!error) return 'An unexpected error occurred';

  const errorType = classifyError(error);

  switch (errorType) {
    case ErrorType.NETWORK_ERROR:
      return 'Connection problem. Please check your internet and try again.';

    case ErrorType.RATE_LIMIT_ERROR:
      return 'Too many requests. Please wait a moment before trying again.';

    case ErrorType.AUTH_ERROR:
      return 'Authentication required. Please sign in and try again.';

    case ErrorType.VALIDATION_ERROR:
      return error.message || 'Please check your input and try again.';

    case ErrorType.SERVER_ERROR:
      return 'Server temporarily unavailable. Please try again in a few minutes.';

    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Offline queue for form submissions
 */
class OfflineQueue {
  private queue: Array<{
    id: string;
    type: string;
    data: any;
    timestamp: number;
    retries: number;
  }> = [];

  private readonly STORAGE_KEY = 'karaoke_offline_queue';
  private readonly MAX_RETRIES = 5;

  constructor() {
    this.loadFromStorage();

    // Set up online/offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
      window.addEventListener('beforeunload', () => this.saveToStorage());
    }
  }

  /**
   * Add item to offline queue
   */
  add(type: string, data: any): string {
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.queue.push({
      id,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    });

    this.saveToStorage();

    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Process queued items when back online
   */
  private async processQueue() {
    if (!navigator.onLine || this.queue.length === 0) return;

    const toProcess = [...this.queue];

    for (const item of toProcess) {
      try {
        await this.processItem(item);
        this.remove(item.id);
      } catch (error) {
        item.retries++;

        if (item.retries >= this.MAX_RETRIES) {
          console.error('Max retries exceeded for offline item:', item);
          this.remove(item.id);
        } else {
          // Keep in queue for retry
          this.saveToStorage();
        }
      }
    }
  }

  /**
   * Process individual queue item
   */
  private async processItem(item: any) {
    switch (item.type) {
      case 'karaoke_signup':
        const response = await fetch('/api/karaoke/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });

        if (!response.ok) {
          throw new Error(`Signup failed: ${response.status}`);
        }
        break;

      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  }

  /**
   * Remove item from queue
   */
  private remove(id: string) {
    this.queue = this.queue.filter(item => item.id !== id);
    this.saveToStorage();
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.warn('Failed to save offline queue to storage:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load offline queue from storage:', error);
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queued: this.queue.length,
      pending: this.queue.filter(item => item.retries === 0).length,
      retrying: this.queue.filter(item => item.retries > 0).length
    };
  }
}

// Global offline queue instance
export const offlineQueue = new OfflineQueue();

/**
 * Enhanced fetch with error recovery
 */
export async function resilientFetch(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<ErrorRecoveryResult<Response>> {
  return withRetry(async () => {
    const response = await fetch(url, {
      ...options,
      // Add timeout
      signal: options.signal || AbortSignal.timeout(30000) // 30 second timeout
    });

    // Check for HTTP errors
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      throw error;
    }

    return response;
  }, retryOptions);
}

/**
 * Error boundary utility - moved to separate component file for JSX support
 * Import from '@/components/ErrorRecoveryBoundary' instead
 */

/**
 * Hook for offline/online status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook for retrying failed operations
 */
export function useRetryableOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const [data, setData] = React.useState<T | null>(null);

  const execute = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await withRetry(operation, options);

    if (result.success) {
      setData(result.data!);
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, [operation, options]);

  return { execute, loading, error, data, retry: execute };
}

// Import React for ErrorBoundary and hooks
import React from 'react';
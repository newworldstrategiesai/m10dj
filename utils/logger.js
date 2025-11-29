/**
 * Centralized logging utility
 * Replaces console.log/error/warn with structured logging
 * Production-safe: No console output in production builds
 */

const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  _log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(data && { data })
    };

    // In production, only log errors to console
    // All other logs should go to logging service
    if (this.isProduction && level !== LOG_LEVELS.ERROR) {
      // In production, send to logging service instead of console
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      return;
    }

    // Format for console
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;
    
    switch (level) {
      case LOG_LEVELS.DEBUG:
        // Only log debug in development
        if (this.isDevelopment) {
          console.log(prefix, message, data || '');
        }
        break;
      case LOG_LEVELS.INFO:
        // Info logs only in development
        if (this.isDevelopment) {
          console.log(prefix, message, data || '');
        }
        break;
      case LOG_LEVELS.WARN:
        // Warnings in both dev and prod (but can be filtered)
        if (this.isDevelopment) {
          console.warn(prefix, message, data || '');
        } else {
          // In production, warnings go to error service
          // TODO: Send to logging service
        }
        break;
      case LOG_LEVELS.ERROR:
        // Errors always logged (even in production)
        console.error(prefix, message, data || '');
        // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
        break;
    }
  }

  debug(message, data) {
    this._log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message, data) {
    this._log(LOG_LEVELS.INFO, message, data);
  }

  warn(message, data) {
    this._log(LOG_LEVELS.WARN, message, data);
  }

  error(message, error = null) {
    const errorData = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      : error;
    this._log(LOG_LEVELS.ERROR, message, errorData);
  }
}

// Create default logger instance
export const logger = new Logger('App');

// Factory function for creating context-specific loggers
export function createLogger(context) {
  return new Logger(context);
}

// Suppress console.log in production (client-side only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Override console methods in production to prevent accidental logging
  const originalLog = console.log;
  const originalDebug = console.debug;
  const originalInfo = console.info;
  
  console.log = function(...args) {
    // Only allow through if it's from our logger
    if (args[0] && typeof args[0] === 'string' && args[0].includes('[ERROR]')) {
      originalLog.apply(console, args);
    }
    // Otherwise, suppress in production
  };
  
  console.debug = function() {
    // Suppress all debug logs in production
  };
  
  console.info = function() {
    // Suppress all info logs in production
  };
}

export default logger;


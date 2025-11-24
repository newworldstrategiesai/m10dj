/**
 * Centralized logging utility
 * Replaces console.log/error/warn with structured logging
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

    // In production, you might want to send to a logging service
    if (!this.isDevelopment && level === LOG_LEVELS.ERROR) {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    }

    // Format for console
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;
    
    switch (level) {
      case LOG_LEVELS.DEBUG:
        if (this.isDevelopment) {
          console.log(prefix, message, data || '');
        }
        break;
      case LOG_LEVELS.INFO:
        console.log(prefix, message, data || '');
        break;
      case LOG_LEVELS.WARN:
        console.warn(prefix, message, data || '');
        break;
      case LOG_LEVELS.ERROR:
        console.error(prefix, message, data || '');
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

export default logger;


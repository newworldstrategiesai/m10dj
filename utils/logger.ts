/**
 * Centralized logging utility
 * Replaces console.log/error/warn with proper logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  product?: string;
  userId?: string;
  organizationId?: string;
  path?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (this.isProduction) {
      return level === 'warn' || level === 'error';
    }
    // In development, log everything
    return true;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      if (this.isDevelopment) {
        console.debug(this.formatMessage('debug', message, context));
      }
      // In production, send to logging service (Sentry, LogRocket, etc.)
      // TODO: Integrate with logging service
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      if (this.isDevelopment) {
        console.info(this.formatMessage('info', message, context));
      }
      // TODO: Send to logging service
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
      // TODO: Send to logging service (Sentry)
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      };
      
      console.error(this.formatMessage('error', message, errorContext));
      
      // TODO: Send to error tracking service (Sentry)
      // if (this.isProduction && typeof window !== 'undefined') {
      //   Sentry.captureException(error, { extra: errorContext });
      // }
    }
  }

  // Helper for API route logging
  api(route: string, method: string, status: number, context?: LogContext): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    this[level](`API ${method} ${route} - ${status}`, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | unknown, context?: LogContext) => 
    logger.error(message, error, context),
  api: (route: string, method: string, status: number, context?: LogContext) =>
    logger.api(route, method, status, context),
};












/**
 * Client-side error logging utility for form submissions
 * 
 * This helps track and diagnose issues with the lead form
 */

export class FormErrorLogger {
  constructor(formName = 'ContactForm') {
    this.formName = formName;
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log a form event (submission attempt, success, failure, etc.)
   */
  logEvent(eventType, data = {}) {
    const logEntry = {
      formName: this.formName,
      sessionId: this.sessionId,
      eventType,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      ...data
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[FormLogger]', eventType, logEntry);
    }

    // Store in localStorage for debugging
    try {
      if (typeof window !== 'undefined') {
        const logs = this.getStoredLogs();
        logs.push(logEntry);
        
        // Keep only last 50 logs
        const recentLogs = logs.slice(-50);
        localStorage.setItem('form_error_logs', JSON.stringify(recentLogs));
      }
    } catch (e) {
      console.warn('Could not store log:', e);
    }

    // In production, you could send to an analytics service
    if (process.env.NODE_ENV === 'production' && eventType === 'error') {
      this.sendToAnalytics(logEntry);
    }

    return logEntry;
  }

  /**
   * Get stored logs from localStorage
   */
  getStoredLogs() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('form_error_logs');
        return stored ? JSON.parse(stored) : [];
      }
    } catch (e) {
      console.warn('Could not retrieve logs:', e);
    }
    return [];
  }

  /**
   * Clear stored logs
   */
  clearLogs() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('form_error_logs');
      }
    } catch (e) {
      console.warn('Could not clear logs:', e);
    }
  }

  /**
   * Send error to analytics service (placeholder)
   */
  sendToAnalytics(logEntry) {
    // You could integrate with services like:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - Custom endpoint
    
    // Example:
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logEntry)
    // }).catch(console.error);
  }

  /**
   * Log a submission attempt
   */
  logSubmissionAttempt(formData) {
    return this.logEvent('submission_attempt', {
      hasName: !!formData.name,
      hasEmail: !!formData.email,
      hasPhone: !!formData.phone,
      eventType: formData.eventType
    });
  }

  /**
   * Log a validation error
   */
  logValidationError(errors) {
    return this.logEvent('validation_error', { errors });
  }

  /**
   * Log an API error
   */
  logApiError(error, attempt, maxAttempts) {
    return this.logEvent('api_error', {
      error: error.message,
      attempt,
      maxAttempts,
      willRetry: attempt < maxAttempts
    });
  }

  /**
   * Log a successful submission
   */
  logSuccess(submissionId, contactId) {
    return this.logEvent('submission_success', {
      submissionId,
      contactId
    });
  }

  /**
   * Log a network error
   */
  logNetworkError(error) {
    return this.logEvent('network_error', {
      error: error.message,
      type: error.name
    });
  }

  /**
   * Get a summary of recent errors
   */
  getErrorSummary() {
    const logs = this.getStoredLogs();
    const errors = logs.filter(log => 
      log.eventType === 'error' || 
      log.eventType === 'api_error' ||
      log.eventType === 'network_error'
    );

    return {
      totalErrors: errors.length,
      recentErrors: errors.slice(-10),
      errorTypes: errors.reduce((acc, log) => {
        acc[log.eventType] = (acc[log.eventType] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

export default FormErrorLogger;


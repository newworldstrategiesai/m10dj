/**
 * Idempotency Utility
 * 
 * Prevents duplicate form submissions by tracking submission IDs
 * Uses in-memory storage + localStorage for client-side tracking
 */

class IdempotencyManager {
  constructor() {
    // Server-side: in-memory storage (consider Redis for production)
    this.processedRequests = new Map();
    
    // Clean up old entries every 10 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }
  }

  /**
   * Generate a unique idempotency key
   * @returns {string} Unique key
   */
  generateKey() {
    // Combine timestamp, random string, and performance marker
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const performance = typeof window !== 'undefined' && window.performance 
      ? window.performance.now().toString(36) 
      : '';
    
    return `${timestamp}-${random}${performance}`.replace(/\./g, '');
  }

  /**
   * Check if a request with this key has been processed
   * @param {string} key - Idempotency key
   * @param {number} maxAge - Maximum age in milliseconds (default 1 hour)
   * @returns {boolean} True if already processed
   */
  isProcessed(key, maxAge = 60 * 60 * 1000) {
    if (!this.processedRequests.has(key)) {
      return false;
    }

    const entry = this.processedRequests.get(key);
    const age = Date.now() - entry.timestamp;

    if (age > maxAge) {
      // Entry is too old, remove it
      this.processedRequests.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Mark a request as processed
   * @param {string} key - Idempotency key
   * @param {any} result - Result to store (optional)
   */
  markProcessed(key, result = null) {
    this.processedRequests.set(key, {
      timestamp: Date.now(),
      result
    });
  }

  /**
   * Get the result of a previously processed request
   * @param {string} key - Idempotency key
   * @returns {any|null} Result or null if not found
   */
  getResult(key) {
    if (!this.processedRequests.has(key)) {
      return null;
    }

    return this.processedRequests.get(key).result;
  }

  /**
   * Clean up old entries
   * @param {number} maxAge - Maximum age in milliseconds (default 2 hours)
   */
  cleanup(maxAge = 2 * 60 * 60 * 1000) {
    const now = Date.now();

    for (const [key, entry] of this.processedRequests.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.processedRequests.delete(key);
      }
    }
  }

  /**
   * Clear a specific key (e.g. on failure so user can retry)
   */
  clearKey(key) {
    if (key) this.processedRequests.delete(key);
  }

  /**
   * Clear all entries
   */
  clear() {
    this.processedRequests.clear();
  }
}

// Server-side singleton
const serverIdempotency = new IdempotencyManager();

/**
 * Client-side idempotency tracking using localStorage
 */
export class ClientIdempotencyTracker {
  constructor(storageKey = 'form_submissions') {
    this.storageKey = storageKey;
  }

  /**
   * Check if a submission was recently made with similar data
   * @param {object} formData - Form data to check
   * @param {number} withinSeconds - Time window to check (default 60 seconds)
   * @returns {boolean} True if duplicate detected
   */
  isDuplicate(formData, withinSeconds = 60) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    try {
      const submissions = this.getRecentSubmissions(withinSeconds);
      const dataHash = this.hashFormData(formData);

      return submissions.some(sub => sub.hash === dataHash);
    } catch (error) {
      console.warn('Error checking for duplicate submission:', error);
      return false;
    }
  }

  /**
   * Record a submission
   * @param {object} formData - Form data that was submitted
   * @param {string} idempotencyKey - The idempotency key used
   */
  recordSubmission(formData, idempotencyKey) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const submissions = this.getRecentSubmissions(300); // Keep last 5 minutes
      
      submissions.push({
        timestamp: Date.now(),
        hash: this.hashFormData(formData),
        key: idempotencyKey
      });

      localStorage.setItem(this.storageKey, JSON.stringify(submissions));
    } catch (error) {
      console.warn('Error recording submission:', error);
    }
  }

  /**
   * Get recent submissions
   * @param {number} withinSeconds - Time window
   * @returns {Array} Recent submissions
   */
  getRecentSubmissions(withinSeconds) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return [];
      }

      const submissions = JSON.parse(stored);
      const cutoff = Date.now() - (withinSeconds * 1000);

      return submissions.filter(sub => sub.timestamp > cutoff);
    } catch (error) {
      console.warn('Error getting recent submissions:', error);
      return [];
    }
  }

  /**
   * Create a simple hash of form data for duplicate detection
   * @param {object} formData - Form data
   * @returns {string} Hash string
   */
  hashFormData(formData) {
    // Create a stable string representation
    const normalized = {
      email: (formData.email || '').toLowerCase().trim(),
      phone: (formData.phone || '').replace(/\D/g, ''),
      name: (formData.name || '').toLowerCase().trim(),
      eventType: formData.eventType || ''
    };

    return JSON.stringify(normalized);
  }

  /**
   * Clear all recorded submissions
   */
  clear() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.storageKey);
    }
  }
}

/**
 * Middleware for Next.js API routes to handle idempotency
 */
export function createIdempotencyMiddleware() {
  return async function idempotencyMiddleware(req, res, next) {
    const idempotencyKey = req.headers['idempotency-key'] || req.body?.idempotencyKey;

    if (!idempotencyKey) {
      // No idempotency key provided, proceed normally
      if (typeof next === 'function') {
        return next();
      }
      return true;
    }

    // Check if this request was already processed
    if (serverIdempotency.isProcessed(idempotencyKey)) {
      const previousResult = serverIdempotency.getResult(idempotencyKey);
      
      console.log(`⚠️ Duplicate request detected: ${idempotencyKey}`);
      
      if (previousResult) {
        return res.status(200).json({
          ...previousResult,
          _idempotent: true,
          _message: 'This request was already processed'
        });
      }

      return res.status(409).json({
        success: false,
        message: 'This request is already being processed or was recently completed',
        _idempotent: true
      });
    }

    // Mark as being processed
    serverIdempotency.markProcessed(idempotencyKey, { pending: true });

    // Store original res.json to intercept the response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Store the result for future duplicate requests
      serverIdempotency.markProcessed(idempotencyKey, data);
      return originalJson(data);
    };

    if (typeof next === 'function') {
      return next();
    }

    return true;
  };
}

export { serverIdempotency };
export default IdempotencyManager;


/**
 * Rate Limiter Utility
 * 
 * Prevents abuse by limiting the number of requests from a single IP/identifier
 * Uses in-memory storage (for production, consider Redis)
 */

class RateLimiter {
  constructor() {
    this.requests = new Map();
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if a request should be allowed
   * @param {string} identifier - Unique identifier (IP address, email, etc.)
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} { allowed: boolean, retryAfter: number }
   */
  checkLimit(identifier, maxRequests = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const key = `${identifier}`;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requestTimes = this.requests.get(key);
    
    // Filter out requests outside the time window
    const recentRequests = requestTimes.filter(time => now - time < windowMs);
    
    // Update the stored requests
    this.requests.set(key, recentRequests);

    if (recentRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
      
      return {
        allowed: false,
        retryAfter,
        remaining: 0
      };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return {
      allowed: true,
      retryAfter: 0,
      remaining: maxRequests - recentRequests.length
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, times] of this.requests.entries()) {
      const recentTimes = times.filter(time => now - time < maxAge);
      
      if (recentTimes.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentTimes);
      }
    }
  }

  /**
   * Reset rate limit for a specific identifier
   * Useful for testing or manual intervention
   */
  reset(identifier) {
    this.requests.delete(identifier);
  }

  /**
   * Get current request count for an identifier
   */
  getCount(identifier, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const requestTimes = this.requests.get(identifier) || [];
    return requestTimes.filter(time => now - time < windowMs).length;
  }
}

// Export a singleton instance
const rateLimiter = new RateLimiter();

/**
 * Middleware factory for rate limiting Next.js API routes
 */
export function createRateLimitMiddleware(options = {}) {
  const {
    maxRequests = 5,
    windowMs = 15 * 60 * 1000, // 15 minutes
    skipSuccessfulRequests = false,
    keyGenerator = (req) => getClientIp(req)
  } = options;

  return async function rateLimitMiddleware(req, res, next) {
    const identifier = keyGenerator(req);
    const result = rateLimiter.checkLimit(identifier, maxRequests, windowMs);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter);
      res.setHeader('X-RateLimit-Reset', Date.now() + (result.retryAfter * 1000));
      
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter
      });
    }

    // If we have a next function, call it (for middleware chaining)
    if (typeof next === 'function') {
      return next();
    }

    // Return true to indicate the request should proceed
    return true;
  };
}

/**
 * Get client IP address from request
 */
function getClientIp(req) {
  // Check various headers for the real IP (behind proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  const real = req.headers['x-real-ip'];
  const cloudflare = req.headers['cf-connecting-ip'];
  
  if (cloudflare) return cloudflare;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (real) return real;
  
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         'unknown';
}

export { rateLimiter, getClientIp };
export default rateLimiter;


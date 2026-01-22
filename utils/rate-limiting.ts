/**
 * Rate limiting utilities for karaoke system
 * Prevents abuse and ensures fair usage
 */

import { NextApiRequest } from 'next';

// Simple in-memory rate limiter (for production, use Redis or similar)
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private windowMs: number = 60000, // 1 minute
    public maxRequests: number = 10
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(key: string): number {
    const record = this.requests.get(key);
    if (!record || Date.now() > record.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - record.count);
  }

  getResetTime(key: string): number {
    const record = this.requests.get(key);
    return record?.resetTime || Date.now() + this.windowMs;
  }

  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.requests.entries());
    for (const [key, record] of entries) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Global rate limiters for different endpoints
export const rateLimiters = {
  // Signup endpoints - strict limits to prevent spam
  signup: new RateLimiter(5 * 60 * 1000, 3), // 3 signups per 5 minutes
  signupByOrg: new RateLimiter(60 * 1000, 5), // 5 signups per minute per org

  // Queue endpoints - moderate limits
  queue: new RateLimiter(30 * 1000, 20), // 20 requests per 30 seconds
  status: new RateLimiter(30 * 1000, 30), // 30 status checks per 30 seconds

  // Admin endpoints - higher limits but still protected
  adminUpdate: new RateLimiter(60 * 1000, 60), // 60 updates per minute
  adminBulk: new RateLimiter(5 * 60 * 1000, 10), // 10 bulk operations per 5 minutes

  // Search endpoints - generous limits
  search: new RateLimiter(60 * 1000, 100), // 100 searches per minute

  // Payment endpoints - strict limits
  payment: new RateLimiter(5 * 60 * 1000, 5), // 5 payment operations per 5 minutes
};

/**
 * Generate rate limit key based on request
 */
export function getRateLimitKey(req: NextApiRequest, type: keyof typeof rateLimiters): string {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const orgId = req.query.organization_id as string;

  switch (type) {
    case 'signup':
      return `signup:${ip}:${userAgent}`;
    case 'signupByOrg':
      return `signup_org:${orgId}:${ip}`;
    case 'queue':
      return `queue:${orgId}:${ip}`;
    case 'status':
      return `status:${ip}`;
    case 'adminUpdate':
      return `admin_update:${orgId}:${ip}`;
    case 'adminBulk':
      return `admin_bulk:${orgId}:${ip}`;
    case 'search':
      return `search:${ip}`;
    case 'payment':
      return `payment:${orgId}:${ip}`;
    default:
      return `${type}:${ip}`;
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const realIP = req.headers['x-real-ip'] as string;
  const clientIP = req.headers['x-client-ip'] as string;

  // Try forwarded header first (most common with proxies)
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Try other headers
  if (realIP) {
    return realIP;
  }

  if (clientIP) {
    return clientIP;
  }

  // Fallback to connection remote address
  return req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}

/**
 * Apply rate limiting to an API endpoint
 */
export function withRateLimit(
  handler: (req: NextApiRequest, res: any) => Promise<any> | any,
  limiterType: keyof typeof rateLimiters,
  options: {
    skipForAdmins?: boolean;
    customKey?: (req: NextApiRequest) => string;
  } = {}
) {
  return async (req: NextApiRequest, res: any) => {
    try {
      // Cleanup old rate limit records periodically
      if (Math.random() < 0.01) { // 1% chance to cleanup
        Object.values(rateLimiters).forEach(limiter => limiter.cleanup());
      }

      const key = options.customKey
        ? options.customKey(req)
        : getRateLimitKey(req, limiterType);

      const limiter = rateLimiters[limiterType];

      if (!limiter.isAllowed(key)) {
        const resetTime = limiter.getResetTime(key);
        const remaining = limiter.getRemainingRequests(key);

        res.setHeader('X-RateLimit-Limit', limiter.maxRequests);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
        res.setHeader('Retry-After', Math.ceil((resetTime - Date.now()) / 1000));

        return res.status(429).json({
          error: 'Too many requests',
          message: 'Please wait before making another request',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
          limit: limiter.maxRequests,
          remaining: remaining
        });
      }

      // Add rate limit headers to successful responses
      const remaining = limiter.getRemainingRequests(key);
      const resetTime = limiter.getResetTime(key);

      res.setHeader('X-RateLimit-Limit', limiter.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

      return handler(req, res);
    } catch (error) {
      console.error('Rate limiting error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Validate request for suspicious patterns (basic anti-abuse)
 */
export function validateRequestSanity(req: NextApiRequest): { valid: boolean; reason?: string } {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';

  // Block obviously malicious requests
  if (!userAgent || userAgent.length < 10) {
    return { valid: false, reason: 'Invalid user agent' };
  }

  // Block requests with suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip'
  ];

  for (const header of suspiciousHeaders) {
    const value = req.headers[header] as string;
    if (value && value.includes(',')) {
      // Multiple IPs might indicate proxy abuse
      const ips = value.split(',').map(ip => ip.trim());
      if (ips.length > 3) {
        return { valid: false, reason: 'Too many forwarded IPs' };
      }
    }
  }

  return { valid: true };
}

/**
 * Enhanced security wrapper for karaoke endpoints
 */
export function withSecurity(
  handler: (req: NextApiRequest, res: any) => Promise<any> | any,
  limiterType: keyof typeof rateLimiters,
  options: {
    requireOrgId?: boolean;
    allowAdminOverride?: boolean;
  } = {}
) {
  return withRateLimit(async (req, res) => {
    // Basic request validation
    const validation = validateRequestSanity(req);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Bad request',
        message: validation.reason
      });
    }

    // Organization ID validation
    if (options.requireOrgId) {
      let organizationId = req.query.organization_id;

      // For POST/PUT/PATCH requests, check body as well
      if (!organizationId && ['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
        organizationId = req.body?.organization_id;
      }

      if (!organizationId) {
        return res.status(400).json({
          error: 'Missing organization_id',
          message: 'Organization ID is required'
        });
      }
    }

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    return handler(req, res);
  }, limiterType);
}
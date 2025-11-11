/**
 * Input Sanitization Utility
 * 
 * Protects against XSS, SQL injection, and other malicious input
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * @param {string} input - The input string to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, options = {}) {
  if (typeof input !== 'string') {
    return '';
  }

  const {
    allowHtml = false,
    maxLength = 10000,
    trim = true
  } = options;

  let sanitized = input;

  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Enforce max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove HTML tags and potentially dangerous characters
  if (!allowHtml) {
    sanitized = sanitized
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove iframe tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Remove all HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove HTML entities that could be used for XSS
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&amp;/g, '&');
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Sanitize an email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }

  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim();

  // Remove any characters that aren't valid in emails
  sanitized = sanitized.replace(/[^\w\s@.\-+]/gi, '');

  // Ensure only one @ symbol
  const parts = sanitized.split('@');
  if (parts.length > 2) {
    sanitized = parts[0] + '@' + parts.slice(1).join('');
  }

  return sanitized;
}

/**
 * Sanitize a phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string} Sanitized phone number
 */
export function sanitizePhone(phone) {
  if (typeof phone !== 'string') {
    return '';
  }

  // Allow only numbers, spaces, dashes, parentheses, and plus sign
  return phone.replace(/[^\d\s\-\(\)\+]/g, '').trim();
}

/**
 * Sanitize a URL
 * @param {string} url - URL to sanitize
 * @returns {string|null} Sanitized URL or null if invalid
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Check for javascript: and data: URLs (XSS vectors)
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }

  // Only allow http, https, and mailto protocols
  if (!/^(https?:\/\/|mailto:)/i.test(trimmed) && !/^\//.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize a date string
 * @param {string} dateString - Date string to sanitize
 * @returns {string|null} ISO date string or null if invalid
 */
export function sanitizeDate(dateString) {
  if (!dateString) {
    return null;
  }

  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    // Return ISO date (YYYY-MM-DD)
    return date.toISOString().split('T')[0];
  } catch (error) {
    return null;
  }
}

/**
 * Sanitize an entire form data object
 * @param {object} formData - Form data to sanitize
 * @param {object} schema - Schema defining field types
 * @returns {object} Sanitized form data
 */
export function sanitizeFormData(formData, schema = {}) {
  const sanitized = {};

  for (const [key, value] of Object.entries(formData)) {
    const fieldType = schema[key] || 'string';

    switch (fieldType) {
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;
      
      case 'phone':
        sanitized[key] = sanitizePhone(value);
        break;
      
      case 'url':
        sanitized[key] = sanitizeUrl(value);
        break;
      
      case 'date':
        sanitized[key] = sanitizeDate(value);
        break;
      
      case 'number':
        sanitized[key] = typeof value === 'number' ? value : parseFloat(value) || 0;
        break;
      
      case 'boolean':
        sanitized[key] = Boolean(value);
        break;
      
      case 'html':
        sanitized[key] = sanitizeString(value, { allowHtml: true });
        break;
      
      case 'string':
      default:
        sanitized[key] = sanitizeString(value);
        break;
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize contact form data specifically
 * @param {object} formData - Contact form data
 * @returns {object} Sanitized and validated data
 */
export function sanitizeContactFormData(formData) {
  return {
    name: sanitizeString(formData.name, { maxLength: 200 }),
    email: sanitizeEmail(formData.email),
    phone: sanitizePhone(formData.phone),
    eventType: sanitizeString(formData.eventType, { maxLength: 100 }),
    eventDate: sanitizeDate(formData.eventDate),
    location: sanitizeString(formData.location, { maxLength: 500 }),
    message: sanitizeString(formData.message, { maxLength: 5000 })
  };
}

/**
 * Check if a string contains suspicious patterns (SQL injection, XSS, etc.)
 * @param {string} input - String to check
 * @returns {boolean} True if suspicious patterns detected
 */
export function hasSuspiciousPatterns(input) {
  if (typeof input !== 'string') {
    return false;
  }

  const suspiciousPatterns = [
    // SQL injection patterns
    /(\bunion\b.*\bselect\b)/i,
    /(\bselect\b.*\bfrom\b)/i,
    /(\binsert\b.*\binto\b)/i,
    /(\bdelete\b.*\bfrom\b)/i,
    /(\bdrop\b.*\btable\b)/i,
    /(\bupdate\b.*\bset\b)/i,
    /(;|\-\-|\/\*|\*\/)/,
    
    // XSS patterns
    /<script[^>]*>.*?<\/script>/i,
    /<iframe[^>]*>.*?<\/iframe>/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<img[^>]+src[^>]*>/i,
    
    // Command injection
    /[;&|`$()]/,
    
    // Path traversal
    /\.\.[\/\\]/,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Check if email looks like a real email (basic heuristics)
 * @param {string} email - Email to check
 * @returns {boolean} True if email looks legitimate
 */
export function isLegitimateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Check basic format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.ru$/i, // High spam rate (optional - might have legitimate users)
    /noreply|no-reply/i,
    /test|temp|fake|spam/i,
    /^\d+@/, // Starts with only numbers
    /^[a-z]{1,2}@/i, // Very short local part
  ];

  // Don't reject, just flag if suspicious
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(email));

  return !isSuspicious;
}

export default {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeDate,
  sanitizeFormData,
  sanitizeContactFormData,
  hasSuspiciousPatterns,
  isLegitimateEmail
};


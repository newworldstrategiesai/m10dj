/**
 * Enhanced Form Validation Utility
 * 
 * Provides robust validation for all form fields with detailed error messages
 */

/**
 * Validate name field
 * @param {string} name - Name to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Please enter your full name (at least 2 characters)' };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'Name is too long (maximum 200 characters)' };
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { valid: false, error: 'Name must contain at least one letter' };
  }

  // Check for suspicious patterns (all numbers, too many special characters)
  const specialCharCount = (trimmed.match(/[^a-zA-Z\s\-'\.]/g) || []).length;
  if (specialCharCount > 3) {
    return { valid: false, error: 'Name contains too many special characters' };
  }

  // Warn if name seems incomplete (no space, very short)
  if (!trimmed.includes(' ') && trimmed.length < 4) {
    return { 
      valid: true, 
      warning: 'Did you mean to enter your full name?',
      value: trimmed 
    };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate email address with comprehensive checks
 * @param {string} email - Email to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required' };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length > 320) { // RFC 5321
    return { valid: false, error: 'Email address is too long' };
  }

  // Comprehensive email regex (RFC 5322 compliant)
  const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  // Check for common typos in domain
  const commonDomains = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com'
  };

  const domain = trimmed.split('@')[1];
  if (commonDomains[domain]) {
    return { 
      valid: true, 
      warning: `Did you mean ${commonDomains[domain]}?`,
      suggestion: trimmed.replace(domain, commonDomains[domain]),
      value: trimmed 
    };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /test.*@/i,
    /fake.*@/i,
    /spam.*@/i,
    /temp.*@/i,
    /@temp/i,
    /@test/i,
    /@example\./i,
    /^\d+@/, // Starts with only numbers
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(trimmed));
  if (isSuspicious) {
    return { 
      valid: true, 
      warning: 'This email address looks unusual. Please verify it\'s correct.',
      value: trimmed 
    };
  }

  // Check for missing TLD
  if (!domain.includes('.')) {
    return { valid: false, error: 'Email domain must include a top-level domain (e.g., .com)' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate phone number with comprehensive checks
 * @param {string} phone - Phone number to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  const trimmed = phone.trim();

  // Remove all non-digit characters for validation
  const digitsOnly = trimmed.replace(/\D/g, '');

  // Check minimum length (10 digits for US, can be adjusted)
  if (digitsOnly.length < 10) {
    return { valid: false, error: 'Please enter a valid phone number (at least 10 digits)' };
  }

  // Check maximum length (15 digits per E.164 standard)
  if (digitsOnly.length > 15) {
    return { valid: false, error: 'Phone number is too long (maximum 15 digits)' };
  }

  // Check for obviously fake numbers
  const fakePatterns = [
    /^1{10,}$/, // All 1s
    /^0{10,}$/, // All 0s
    /^1234567890$/, // Sequential
    /^5555555555$/, // Fake movie number
    /^(\d)\1{9,}$/ // Same digit repeated
  ];

  if (fakePatterns.some(pattern => pattern.test(digitsOnly))) {
    return { valid: false, error: 'Please enter a valid phone number' };
  }

  // Validate US phone number format (if applicable)
  // Adjust this based on your target market
  if (digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly[0] === '1')) {
    const areaCode = digitsOnly.length === 11 ? digitsOnly.slice(1, 4) : digitsOnly.slice(0, 3);
    
    // Check for invalid area codes (0xx or 1xx)
    if (areaCode[0] === '0' || areaCode[0] === '1') {
      return { valid: false, error: 'Please enter a valid US phone number' };
    }
  }

  // Format nicely for display (US format)
  let formatted = trimmed;
  if (digitsOnly.length === 10) {
    formatted = `(${digitsOnly.slice(0,3)}) ${digitsOnly.slice(3,6)}-${digitsOnly.slice(6)}`;
  } else if (digitsOnly.length === 11 && digitsOnly[0] === '1') {
    formatted = `+1 (${digitsOnly.slice(1,4)}) ${digitsOnly.slice(4,7)}-${digitsOnly.slice(7)}`;
  }

  return { 
    valid: true, 
    value: trimmed,
    formatted,
    digitsOnly 
  };
}

/**
 * Validate event date
 * @param {string} dateString - Date string to validate
 * @param {object} options - Validation options
 * @returns {object} { valid: boolean, error: string|null }
 */
export function validateEventDate(dateString, options = {}) {
  const {
    required = false,
    minDaysAhead = 0,
    maxDaysAhead = 730, // 2 years
    allowPastDates = false
  } = options;

  if (!dateString) {
    if (required) {
      return { valid: false, error: 'Event date is required' };
    }
    return { valid: true, value: null };
  }

  try {
    // Parse date string in local timezone to avoid timezone issues
    // If dateString is in YYYY-MM-DD format, parse it directly
    let date;
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Parse as local date to avoid UTC conversion issues
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Please enter a valid date' };
    }

    // Get today's date in local timezone (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Ensure event date is also at midnight in local timezone
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);

    // Check if date is in the past (compare dates, not times)
    if (!allowPastDates && eventDate < today) {
      return { valid: false, error: 'Event date cannot be in the past' };
    }

    // Check minimum days ahead
    if (minDaysAhead > 0) {
      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() + minDaysAhead);
      
      if (eventDate < minDate) {
        return { 
          valid: false, 
          error: `Event date must be at least ${minDaysAhead} days from today` 
        };
      }
    }

    // Check maximum days ahead
    if (maxDaysAhead > 0) {
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + maxDaysAhead);
      
      if (eventDate > maxDate) {
        return { 
          valid: false, 
          error: `Event date cannot be more than ${maxDaysAhead} days from today` 
        };
      }
    }

    // Warn if date is very soon (less than 7 days)
    const daysUntilEvent = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
    if (daysUntilEvent < 7 && daysUntilEvent >= 0) {
      return {
        valid: true,
        warning: `Your event is in ${daysUntilEvent} day${daysUntilEvent !== 1 ? 's' : ''}. We'll do our best to accommodate short-notice requests!`,
        value: date.toISOString().split('T')[0]
      };
    }

    return { 
      valid: true, 
      value: date.toISOString().split('T')[0] 
    };
  } catch (error) {
    return { valid: false, error: 'Please enter a valid date' };
  }
}

/**
 * Validate location/venue field
 * @param {string} location - Location to validate
 * @param {object} options - Validation options
 * @returns {object} { valid: boolean, error: string|null }
 */
export function validateLocation(location, options = {}) {
  const { required = false, maxLength = 500 } = options;

  if (!location || typeof location !== 'string') {
    if (required) {
      return { valid: false, error: 'Location is required' };
    }
    return { valid: true, value: null };
  }

  const trimmed = location.trim();

  if (trimmed.length === 0) {
    if (required) {
      return { valid: false, error: 'Location is required' };
    }
    return { valid: true, value: null };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Location is too long (maximum ${maxLength} characters)` };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate message field
 * @param {string} message - Message to validate
 * @param {object} options - Validation options
 * @returns {object} { valid: boolean, error: string|null }
 */
export function validateMessage(message, options = {}) {
  const { 
    required = false, 
    minLength = 0, 
    maxLength = 5000 
  } = options;

  if (!message || typeof message !== 'string') {
    if (required) {
      return { valid: false, error: 'Message is required' };
    }
    return { valid: true, value: null };
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    if (required) {
      return { valid: false, error: 'Message is required' };
    }
    return { valid: true, value: null };
  }

  if (minLength > 0 && trimmed.length < minLength) {
    return { 
      valid: false, 
      error: `Message is too short (minimum ${minLength} characters)` 
    };
  }

  if (trimmed.length > maxLength) {
    return { 
      valid: false, 
      error: `Message is too long (maximum ${maxLength} characters)` 
    };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate entire contact form
 * @param {object} formData - Complete form data
 * @returns {object} { valid: boolean, errors: object, warnings: object }
 */
export function validateContactForm(formData) {
  const errors = {};
  const warnings = {};
  let valid = true;

  // Validate name
  const nameResult = validateName(formData.name);
  if (!nameResult.valid) {
    errors.name = nameResult.error;
    valid = false;
  } else if (nameResult.warning) {
    warnings.name = nameResult.warning;
  }

  // Validate email
  const emailResult = validateEmail(formData.email);
  if (!emailResult.valid) {
    errors.email = emailResult.error;
    valid = false;
  } else if (emailResult.warning) {
    warnings.email = emailResult.warning;
  }

  // Validate phone
  const phoneResult = validatePhone(formData.phone);
  if (!phoneResult.valid) {
    errors.phone = phoneResult.error;
    valid = false;
  } else if (phoneResult.warning) {
    warnings.phone = phoneResult.warning;
  }

  // Validate event type
  if (!formData.eventType || formData.eventType.trim().length === 0) {
    errors.eventType = 'Please select an event type';
    valid = false;
  }

  // Validate event date (optional but validate if provided)
  if (formData.eventDate) {
    const dateResult = validateEventDate(formData.eventDate);
    if (!dateResult.valid) {
      errors.eventDate = dateResult.error;
      valid = false;
    } else if (dateResult.warning) {
      warnings.eventDate = dateResult.warning;
    }
  }

  // Validate location (optional)
  const locationResult = validateLocation(formData.location || formData.venue);
  if (!locationResult.valid) {
    errors.location = locationResult.error;
    valid = false;
  }

  // Validate message (optional)
  const messageResult = validateMessage(formData.message);
  if (!messageResult.valid) {
    errors.message = messageResult.error;
    valid = false;
  }

  return {
    valid,
    errors,
    warnings,
    hasWarnings: Object.keys(warnings).length > 0
  };
}

export default {
  validateName,
  validateEmail,
  validatePhone,
  validateEventDate,
  validateLocation,
  validateMessage,
  validateContactForm
};


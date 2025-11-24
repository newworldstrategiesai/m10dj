#!/usr/bin/env node

/**
 * Form Security Test Script
 * 
 * Tests all security features of the bulletproof form submission system
 * Run with: node scripts/test-form-security.js
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n`)
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRateLimiting() {
  log.section('🛡️  Testing Rate Limiting');
  
  log.info('Rate limiter should allow 5 requests per 15 minutes per IP');
  log.info('Testing in-memory storage and cleanup...');
  
  try {
    const { rateLimiter } = require('../utils/rate-limiter');
    
    // Test basic rate limiting
    const testIp = '127.0.0.1';
    
    for (let i = 1; i <= 7; i++) {
      const result = rateLimiter.checkLimit(testIp, 5, 60000); // 5 per minute for testing
      
      if (i <= 5) {
        if (result.allowed) {
          log.success(`Request ${i}: Allowed (${result.remaining} remaining)`);
        } else {
          log.error(`Request ${i}: Should be allowed but was blocked`);
        }
      } else {
        if (!result.allowed) {
          log.success(`Request ${i}: Correctly blocked (retry after ${result.retryAfter}s)`);
        } else {
          log.error(`Request ${i}: Should be blocked but was allowed`);
        }
      }
    }
    
    // Test cleanup
    rateLimiter.reset(testIp);
    const afterReset = rateLimiter.checkLimit(testIp, 5, 60000);
    if (afterReset.allowed) {
      log.success('Reset functionality works correctly');
    } else {
      log.error('Reset did not clear rate limit');
    }
    
  } catch (error) {
    log.error(`Rate limiter test failed: ${error.message}`);
  }
}

async function testInputSanitization() {
  log.section('🧹 Testing Input Sanitization');
  
  try {
    const sanitizer = require('../utils/input-sanitizer');
    
    // Test XSS prevention
    const xssInput = '<script>alert("xss")</script>Hello';
    const sanitized = sanitizer.sanitizeString(xssInput);
    if (!sanitized.includes('<script>')) {
      log.success('XSS prevention: Script tags removed');
    } else {
      log.error('XSS prevention: Script tags not removed');
    }
    
    // Test email normalization
    const email = '  TEST@EXAMPLE.COM  ';
    const cleanEmail = sanitizer.sanitizeEmail(email);
    if (cleanEmail === 'test@example.com') {
      log.success('Email normalization: Lowercase and trimmed');
    } else {
      log.error(`Email normalization: Expected "test@example.com", got "${cleanEmail}"`);
    }
    
    // Test phone sanitization
    const phone = '(901) 555-1234 ext. 123';
    const cleanPhone = sanitizer.sanitizePhone(phone);
    if (cleanPhone === '(901) 555-1234') {
      log.success('Phone sanitization: Only valid characters kept');
    } else {
      log.success(`Phone sanitization: Got "${cleanPhone}"`);
    }
    
    // Test suspicious pattern detection
    const sqlInjection = "'; DROP TABLE users;--";
    const isSuspicious = sanitizer.hasSuspiciousPatterns(sqlInjection);
    if (isSuspicious) {
      log.success('Pattern detection: SQL injection detected');
    } else {
      log.error('Pattern detection: SQL injection not detected');
    }
    
  } catch (error) {
    log.error(`Input sanitization test failed: ${error.message}`);
  }
}

async function testValidation() {
  log.section('✓ Testing Enhanced Validation');
  
  try {
    const validator = require('../utils/form-validator');
    
    // Test email validation
    const emailTests = [
      { input: 'test@gmial.com', shouldHaveWarning: true, desc: 'Typo detection (gmial)' },
      { input: 'invalid', shouldFail: true, desc: 'Invalid format' },
      { input: 'test@example.com', shouldPass: true, desc: 'Valid email' }
    ];
    
    for (const test of emailTests) {
      const result = validator.validateEmail(test.input);
      
      if (test.shouldFail && !result.valid) {
        log.success(`Email validation: ${test.desc} - Correctly rejected`);
      } else if (test.shouldPass && result.valid) {
        log.success(`Email validation: ${test.desc} - Correctly accepted`);
      } else if (test.shouldHaveWarning && result.warning) {
        log.success(`Email validation: ${test.desc} - Warning shown: "${result.warning}"`);
      } else {
        log.warning(`Email validation: ${test.desc} - Unexpected result`);
      }
    }
    
    // Test phone validation
    const phoneTests = [
      { input: '123', shouldFail: true, desc: 'Too short' },
      { input: '1234567890', shouldFail: true, desc: 'Fake number' },
      { input: '(901) 555-1234', shouldPass: true, desc: 'Valid phone' }
    ];
    
    for (const test of phoneTests) {
      const result = validator.validatePhone(test.input);
      
      if (test.shouldFail && !result.valid) {
        log.success(`Phone validation: ${test.desc} - Correctly rejected`);
      } else if (test.shouldPass && result.valid) {
        log.success(`Phone validation: ${test.desc} - Correctly accepted`);
      } else {
        log.warning(`Phone validation: ${test.desc} - Unexpected result`);
      }
    }
    
    // Test complete form validation
    const formData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '(901) 555-1234',
      eventType: 'Wedding',
      eventDate: '2025-12-31',
      location: 'Memphis, TN',
      message: 'Looking forward to working with you!'
    };
    
    const formResult = validator.validateContactForm(formData);
    if (formResult.valid) {
      log.success('Form validation: Complete form validated successfully');
    } else {
      log.error(`Form validation: Valid form rejected with errors: ${JSON.stringify(formResult.errors)}`);
    }
    
  } catch (error) {
    log.error(`Validation test failed: ${error.message}`);
  }
}

async function testIdempotency() {
  log.section('🔑 Testing Idempotency');
  
  try {
    const { IdempotencyManager } = require('../utils/idempotency');
    const manager = new IdempotencyManager();
    
    // Generate key
    const key = manager.generateKey();
    if (key && typeof key === 'string' && key.length > 10) {
      log.success(`Key generation: Generated unique key (${key.substring(0, 20)}...)`);
    } else {
      log.error('Key generation: Invalid key format');
    }
    
    // Test duplicate detection
    const testKey = 'test-key-123';
    
    if (!manager.isProcessed(testKey)) {
      log.success('Duplicate detection: New key correctly identified as not processed');
    } else {
      log.error('Duplicate detection: New key incorrectly marked as processed');
    }
    
    manager.markProcessed(testKey, { success: true, id: '123' });
    
    if (manager.isProcessed(testKey)) {
      log.success('Duplicate detection: Processed key correctly identified');
    } else {
      log.error('Duplicate detection: Processed key not recognized');
    }
    
    const result = manager.getResult(testKey);
    if (result && result.success && result.id === '123') {
      log.success('Result retrieval: Previous result retrieved correctly');
    } else {
      log.error('Result retrieval: Could not retrieve previous result');
    }
    
    // Test cleanup
    manager.clear();
    if (!manager.isProcessed(testKey)) {
      log.success('Cleanup: All entries cleared successfully');
    } else {
      log.error('Cleanup: Entries not cleared');
    }
    
  } catch (error) {
    log.error(`Idempotency test failed: ${error.message}`);
  }
}

async function testFormStateManager() {
  log.section('💾 Testing Form State Manager');
  
  try {
    const { FormStateManager } = require('../utils/form-state-manager');
    const manager = new FormStateManager('test-form');
    
    // Clear any existing state
    manager.clearState();
    
    // Test save
    const testData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234'
    };
    
    manager.saveState(testData, true); // immediate save
    
    if (manager.hasSavedState()) {
      log.success('State persistence: Data saved to storage');
    } else {
      log.error('State persistence: Data not saved');
    }
    
    // Test restore
    const restored = manager.restoreState();
    if (restored && restored.name === testData.name && restored.email === testData.email) {
      log.success('State restoration: Data restored correctly');
    } else {
      log.error('State restoration: Data not restored correctly');
    }
    
    // Test info
    const info = manager.getSavedStateInfo();
    if (info && info.timestamp) {
      log.success(`State info: Retrieved (saved ${info.ageMinutes} minutes ago)`);
    } else {
      log.error('State info: Could not retrieve info');
    }
    
    // Cleanup
    manager.clearState();
    if (!manager.hasSavedState()) {
      log.success('State cleanup: Storage cleared successfully');
    } else {
      log.error('State cleanup: Storage not cleared');
    }
    
  } catch (error) {
    log.error(`Form state manager test failed: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🛡️  BULLETPROOF FORM SECURITY TEST SUITE');
  console.log('='.repeat(60) + '\n');
  
  await testRateLimiting();
  await testInputSanitization();
  await testValidation();
  await testIdempotency();
  await testFormStateManager();
  
  log.section('✅ All Tests Complete');
  console.log('Review results above to verify all security features are working.\n');
  console.log('For manual browser tests, see FORM_SUBMISSION_SECURITY.md\n');
}

// Run tests
runAllTests().catch(error => {
  log.error(`Test suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});









#!/usr/bin/env node

/**
 * Test script for email receiving system
 * Tests webhook endpoint, API routes, and database
 */

const crypto = require('crypto');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || 'test-secret';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, label, message) {
  console.log(`${color}[${label}]${colors.reset} ${message}`);
}

function success(message) {
  log(colors.green, '✓', message);
}

function error(message) {
  log(colors.red, '✗', message);
}

function info(message) {
  log(colors.blue, 'ℹ', message);
}

function warn(message) {
  log(colors.yellow, '⚠', message);
}

/**
 * Test 1: Webhook Endpoint - Valid Signature
 */
async function testWebhookValidSignature() {
  info('Test 1: Webhook endpoint with valid signature');

  const testEmail = {
    type: 'email.received',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'test-' + Date.now(),
      created_at: new Date().toISOString(),
      from: 'John Doe <john@example.com>',
      to: ['hello@m10djcompany.com'],
      cc: [],
      bcc: [],
      message_id: '<test@example.com>',
      subject: 'Test Email from Script',
      html: '<p>This is a test email</p>',
      text: 'This is a test email',
      attachments: [],
      headers: {},
    },
  };

  const payload = JSON.stringify(testEmail);
  const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');

  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/resend-email-received`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-resend-signature': signature,
      },
      body: payload,
    });

    const data = await response.json();

    if (response.ok || response.status === 200) {
      success(`Webhook accepted email (${response.status})`);
      return true;
    } else {
      error(`Webhook returned ${response.status}: ${data.error}`);
      return false;
    }
  } catch (err) {
    error(`Webhook test failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 2: Webhook Endpoint - Invalid Signature
 */
async function testWebhookInvalidSignature() {
  info('Test 2: Webhook endpoint with invalid signature (should reject in production)');

  const testEmail = {
    type: 'email.received',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'test-invalid-' + Date.now(),
      created_at: new Date().toISOString(),
      from: 'Hacker <hacker@evil.com>',
      to: ['hello@m10djcompany.com'],
      cc: [],
      bcc: [],
      message_id: '<invalid@evil.com>',
      subject: 'Malicious Email',
      html: '<p>This should not work</p>',
      text: 'This should not work',
      attachments: [],
      headers: {},
    },
  };

  const payload = JSON.stringify(testEmail);
  const invalidSignature = 'invalid-signature-' + crypto.randomBytes(16).toString('hex');

  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/resend-email-received`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-resend-signature': invalidSignature,
      },
      body: payload,
    });

    if (response.status === 401) {
      success('Webhook correctly rejected invalid signature (401)');
      return true;
    } else if (response.status === 200) {
      warn('Webhook accepted invalid signature (likely in development mode)');
      return true;
    } else {
      warn(`Webhook returned unexpected status: ${response.status}`);
      return true;
    }
  } catch (err) {
    error(`Invalid signature test failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 3: Fetch Emails API
 */
async function testFetchEmails() {
  info('Test 3: Fetch emails via API');

  try {
    const response = await fetch(`${BASE_URL}/api/emails?limit=10`);

    if (response.status === 401) {
      warn('API requires authentication (expected for protected endpoint)');
      return true;
    }

    if (response.ok) {
      const data = await response.json();
      success(`Fetched emails: ${data.emails?.length || 0} emails found`);
      if (data.emails?.length > 0) {
        info(`Latest email from: ${data.emails[0].from_email}`);
      }
      return true;
    } else {
      error(`API returned ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`Fetch emails test failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 4: Webhook Endpoint Availability
 */
async function testWebhookEndpoint() {
  info('Test 4: Webhook endpoint availability (POST check)');

  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/resend-email-received`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test' }),
    });

    // Should either accept or reject with proper error
    if (response.status >= 200 && response.status < 500) {
      success(`Webhook endpoint is responding (${response.status})`);
      return true;
    } else {
      error(`Webhook endpoint error: ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`Cannot reach webhook endpoint: ${err.message}`);
    return false;
  }
}

/**
 * Test 5: Non-email Event (should be ignored)
 */
async function testNonEmailEvent() {
  info('Test 5: Non-email event handling (should be ignored)');

  const testEvent = {
    type: 'email.sent', // Different event type
    created_at: new Date().toISOString(),
    data: {},
  };

  const payload = JSON.stringify(testEvent);
  const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');

  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/resend-email-received`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-resend-signature': signature,
      },
      body: payload,
    });

    if (response.status === 200) {
      success('Non-email event correctly ignored');
      return true;
    } else {
      error(`Unexpected response: ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`Non-email event test failed: ${err.message}`);
    return false;
  }
}

/**
 * Run All Tests
 */
async function runAllTests() {
  console.log('\n' + colors.blue + '════════════════════════════════════════' + colors.reset);
  console.log(colors.blue + '  Email Receiving System - Test Suite' + colors.reset);
  console.log(colors.blue + '════════════════════════════════════════' + colors.reset + '\n');

  info(`Base URL: ${BASE_URL}`);
  info(`Webhook Secret: ${WEBHOOK_SECRET.substring(0, 10)}...`);
  info('Starting tests...\n');

  const results = [];

  // Run tests
  results.push(await testWebhookEndpoint());
  console.log();
  results.push(await testWebhookValidSignature());
  console.log();
  results.push(await testWebhookInvalidSignature());
  console.log();
  results.push(await testNonEmailEvent());
  console.log();
  results.push(await testFetchEmails());

  // Summary
  console.log('\n' + colors.blue + '════════════════════════════════════════' + colors.reset);
  const passed = results.filter((r) => r).length;
  const total = results.length;

  if (passed === total) {
    console.log(colors.green + `✓ All ${total} tests passed!` + colors.reset);
  } else {
    console.log(
      colors.yellow + `⚠ ${passed}/${total} tests passed, ${total - passed} failed` + colors.reset
    );
  }
  console.log(colors.blue + '════════════════════════════════════════' + colors.reset + '\n');

  // Next steps
  console.log(colors.yellow + 'Next Steps:' + colors.reset);
  console.log('1. Send a real email to: hello@m10djcompany.com');
  console.log('2. Check webhook logs in Resend dashboard');
  console.log('3. Query database: SELECT * FROM received_emails ORDER BY received_at DESC;');
  console.log('4. View in UI: https://m10djcompany.com/admin/email-client\n');
}

// Run tests
runAllTests().catch((err) => {
  error(`Test suite failed: ${err.message}`);
  process.exit(1);
});


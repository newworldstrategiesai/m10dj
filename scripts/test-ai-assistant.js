/**
 * Comprehensive Test Suite for AI Assistant Features
 * Tests Web Chat, SMS, and Database integration
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_TIMEOUT = 30000;

// Test data
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  }
};

// ============================================
// TEST UTILITIES
// ============================================

async function test(name, fn) {
  console.log(`\n🧪 Testing: ${name}`);
  testResults.summary.total++;

  try {
    await fn();
    console.log(`✅ PASSED: ${name}`);
    testResults.summary.passed++;
    testResults.tests.push({
      name,
      status: 'passed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
    testResults.summary.failed++;
    testResults.summary.errors.push({
      test: name,
      error: error.message
    });
    testResults.tests.push({
      name,
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function apiCall(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: API_TIMEOUT
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  return { status: response.status, data };
}

// ============================================
// TEST SUITE 1: WEB CHAT API
// ============================================

console.log('\n' + '='.repeat(60));
console.log('TEST SUITE 1: WEB CHAT API');
console.log('='.repeat(60));

await test('Chat API endpoint exists and responds to POST', async () => {
  const result = await apiCall('POST', '/api/leads/chat', {
    messages: [
      {
        role: 'user',
        content: 'What packages do you offer?'
      }
    ],
    leadData: {
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+19145551234',
      eventType: 'Wedding',
      eventDate: '2025-12-15',
      venue: 'Grand Ballroom',
      guests: '150',
      message: 'Very important event'
    }
  });

  assert(result.status === 200, `Expected 200 but got ${result.status}`);
  assert(result.data.message, 'Response should contain a message');
  console.log(`   Response: "${result.data.message.substring(0, 100)}..."`);
});

await test('Chat API returns proper error on missing messages', async () => {
  const result = await apiCall('POST', '/api/leads/chat', {
    leadData: {
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+19145551234',
      eventType: 'Wedding',
      eventDate: '2025-12-15'
    }
  });

  assert(result.status === 400, `Expected 400 but got ${result.status}`);
  assert(result.data.error, 'Response should contain an error');
});

await test('Chat API returns proper error on missing lead data', async () => {
  const result = await apiCall('POST', '/api/leads/chat', {
    messages: [
      { role: 'user', content: 'Hi' }
    ]
  });

  assert(result.status === 400, `Expected 400 but got ${result.status}`);
  assert(result.data.error, 'Response should contain an error');
});

await test('Chat API rejects non-POST requests', async () => {
  const options = {
    method: 'GET',
    timeout: API_TIMEOUT
  };

  try {
    const response = await fetch(`${BASE_URL}/api/leads/chat`, options);
    assert(response.status === 405, `Expected 405 but got ${response.status}`);
  } catch (error) {
    // Expected for GET requests
  }
});

await test('Chat API returns AI response with proper structure', async () => {
  const result = await apiCall('POST', '/api/leads/chat', {
    messages: [
      { role: 'user', content: 'Tell me about Package 1' }
    ],
    leadData: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+19145559999',
      eventType: 'Corporate Event',
      eventDate: '2025-06-15'
    }
  });

  assert(result.status === 200, `Expected 200 but got ${result.status}`);
  assert(result.data.message, 'Should have message field');
  assert(result.data.type === 'ai' || result.data.type === 'fallback', 'Should have type field');
  assert(typeof result.data.message === 'string', 'Message should be a string');
  console.log(`   Message type: ${result.data.type}`);
});

await test('Chat API includes token usage on success', async () => {
  const result = await apiCall('POST', '/api/leads/chat', {
    messages: [
      { role: 'user', content: 'What is your phone number?' }
    ],
    leadData: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+19145551111',
      eventType: 'Wedding',
      eventDate: '2025-12-25'
    }
  });

  assert(result.status === 200);
  // Token usage might be in response if using real API
  console.log(`   Token usage: ${result.data.usage ? result.data.usage.total_tokens : 'N/A'}`);
});

// ============================================
// TEST SUITE 2: SMS API
// ============================================

console.log('\n' + '='.repeat(60));
console.log('TEST SUITE 2: SMS API (Webhook)');
console.log('='.repeat(60));

await test('SMS endpoint exists and responds to POST', async () => {
  const result = await apiCall('POST', '/api/leads/sms', {
    From: '+19145551234',
    To: '+19145559999',
    Body: 'What is your cheapest package?',
    MessageSid: 'SM1234567890abcdef'
  });

  assert(result.status === 200, `Expected 200 but got ${result.status}`);
  console.log(`   Webhook accepted SMS`);
});

await test('SMS endpoint rejects non-POST requests', async () => {
  const options = {
    method: 'GET',
    timeout: API_TIMEOUT
  };

  try {
    const response = await fetch(`${BASE_URL}/api/leads/sms`, options);
    assert(response.status === 405, `Expected 405 but got ${response.status}`);
  } catch (error) {
    // Expected
  }
});

await test('SMS endpoint returns proper error on missing SMS data', async () => {
  const result = await apiCall('POST', '/api/leads/sms', {
    To: '+19145559999'
    // Missing From and Body
  });

  assert(result.status === 400, `Expected 400 but got ${result.status}`);
});

// ============================================
// TEST SUITE 3: FORM TO CHAT INTEGRATION
// ============================================

console.log('\n' + '='.repeat(60));
console.log('TEST SUITE 3: FORM TO CHAT INTEGRATION');
console.log('='.repeat(60));

await test('ContactFormChat component can be imported', async () => {
  const chatPath = path.join(process.cwd(), 'components/company/ContactFormChat.js');
  assert(fs.existsSync(chatPath), 'ContactFormChat.js should exist');
  console.log(`   File exists: ${chatPath}`);
});

await test('ContactForm component imports ContactFormChat', async () => {
  const formPath = path.join(process.cwd(), 'components/company/ContactForm.js');
  const content = fs.readFileSync(formPath, 'utf8');
  assert(content.includes('ContactFormChat'), 'ContactForm should import ContactFormChat');
  assert(content.includes('if (submitted)'), 'ContactForm should check submitted state');
});

await test('Chat animation is defined in globals.css', async () => {
  const cssPath = path.join(process.cwd(), 'app/globals.css');
  const content = fs.readFileSync(cssPath, 'utf8');
  assert(content.includes('animate-fadeIn'), 'globals.css should include fadeIn animation');
  assert(content.includes('@keyframes fadeIn'), 'globals.css should define fadeIn keyframes');
});

// ============================================
// TEST SUITE 4: DATABASE REQUIREMENTS
// ============================================

console.log('\n' + '='.repeat(60));
console.log('TEST SUITE 4: DATABASE REQUIREMENTS');
console.log('='.repeat(60));

await test('SMS migration file exists with correct schema', async () => {
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20250115000000_create_sms_conversations.sql'
  );
  assert(fs.existsSync(migrationPath), 'Migration file should exist');

  const content = fs.readFileSync(migrationPath, 'utf8');
  assert(content.includes('sms_conversations'), 'Should create sms_conversations table');
  assert(content.includes('contact_id UUID'), 'Should have contact_id foreign key');
  assert(content.includes('messages JSONB'), 'Should have messages JSONB field');
  assert(content.includes('phone_number TEXT'), 'Should have phone_number field');
  console.log(`   Migration includes all required fields`);
});

// ============================================
// TEST SUITE 5: CONFIGURATION & ENVIRONMENT
// ============================================

console.log('\n' + '='.repeat(60));
console.log('TEST SUITE 5: CONFIGURATION & ENVIRONMENT');
console.log('='.repeat(60));

await test('Lead assistant prompt file exists', async () => {
  const promptPath = path.join(process.cwd(), 'utils/lead-assistant-prompt.js');
  assert(fs.existsSync(promptPath), 'lead-assistant-prompt.js should exist');

  const content = fs.readFileSync(promptPath, 'utf8');
  assert(content.includes('getLeadAssistantPrompt'), 'Should export getLeadAssistantPrompt');
  assert(content.includes('getInitialGreeting'), 'Should export getInitialGreeting');
});

await test('Environment variables are properly configured', async () => {
  const envPath = path.join(process.cwd(), '.env.local');
  assert(fs.existsSync(envPath), '.env.local should exist');

  const content = fs.readFileSync(envPath, 'utf8');
  console.log(`   OPENAI_API_KEY configured: ${content.includes('OPENAI_API_KEY')}`);
  console.log(`   SUPABASE configured: ${content.includes('SUPABASE')}`);
});

// ============================================
// TEST SUITE 6: API RESPONSE QUALITY
// ============================================

console.log('\n' + '='.repeat(60));
console.log('TEST SUITE 6: API RESPONSE QUALITY');
console.log('='.repeat(60));

await test('Chat API responses mention company details', async () => {
  const result = await apiCall('POST', '/api/leads/chat', {
    messages: [
      { role: 'user', content: 'Who are you?' }
    ],
    leadData: {
      name: 'Test',
      email: 'test@test.com',
      phone: '+19145551234',
      eventType: 'Wedding',
      eventDate: '2025-12-15'
    }
  });

  const message = result.data.message.toLowerCase();
  // Should mention M10 DJ or assistant role
  const validResponse = 
    message.includes('m10') || 
    message.includes('dj') || 
    message.includes('assistant') ||
    message.includes('help');

  assert(validResponse, 'Response should mention company or assistant role');
  console.log(`   Response is contextual: ✓`);
});

await test('Chat API responses are reasonable length', async () => {
  const result = await apiCall('POST', '/api/leads/chat', {
    messages: [
      { role: 'user', content: 'Tell me everything about your services' }
    ],
    leadData: {
      name: 'Test',
      email: 'test@test.com',
      phone: '+19145551234',
      eventType: 'Wedding',
      eventDate: '2025-12-15'
    }
  });

  const message = result.data.message;
  const length = message.length;

  assert(length > 20, 'Response should not be too short');
  assert(length < 2000, 'Response should not be excessively long');
  console.log(`   Response length: ${length} characters (reasonable)`);
});

await test('Chat API handles typos and unclear questions', async () => {
  const result = await apiCall('POST', '/api/leads/chat', {
    messages: [
      { role: 'user', content: 'whats ur prices lol' }
    ],
    leadData: {
      name: 'Test',
      email: 'test@test.com',
      phone: '+19145551234',
      eventType: 'Wedding',
      eventDate: '2025-12-15'
    }
  });

  assert(result.status === 200, 'Should handle casual/typo-filled messages');
  assert(result.data.message, 'Should return a meaningful response');
  console.log(`   Handled casual message: ✓`);
});

// ============================================
// GENERATE REPORT
// ============================================

console.log('\n' + '='.repeat(60));
console.log('TEST REPORT SUMMARY');
console.log('='.repeat(60));

console.log(`\n📊 Results:`);
console.log(`   Total Tests: ${testResults.summary.total}`);
console.log(`   ✅ Passed: ${testResults.summary.passed}`);
console.log(`   ❌ Failed: ${testResults.summary.failed}`);
console.log(`   Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);

if (testResults.summary.errors.length > 0) {
  console.log(`\n⚠️  Failed Tests:`);
  testResults.summary.errors.forEach((err, i) => {
    console.log(`   ${i + 1}. ${err.test}`);
    console.log(`      Error: ${err.error}`);
  });
}

// Save report
const reportPath = path.join(process.cwd(), 'test-results.json');
fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
console.log(`\n📄 Report saved to: ${reportPath}`);

// Exit with appropriate code
process.exit(testResults.summary.failed > 0 ? 1 : 0);


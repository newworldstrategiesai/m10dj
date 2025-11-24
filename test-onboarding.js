/**
 * Quick Onboarding Test Script
 * 
 * Tests the onboarding API endpoints
 */

const BASE_URL = 'http://localhost:3003';

async function testOnboarding() {
  console.log('🧪 Testing Onboarding Implementation\n');

  // Test 1: QR Code Generation
  console.log('1️⃣ Testing QR Code Generation...');
  try {
    const qrResponse = await fetch(`${BASE_URL}/api/qr-code/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com/test'
      })
    });
    
    if (qrResponse.ok) {
      const qrData = await qrResponse.json();
      console.log('   ✅ QR Code API working');
      console.log('   📸 QR Code URL:', qrData.qrCodeUrl);
    } else {
      console.log('   ❌ QR Code API failed:', qrResponse.status);
    }
  } catch (error) {
    console.log('   ❌ QR Code API error:', error.message);
  }

  // Test 2: Check if onboarding page is accessible
  console.log('\n2️⃣ Testing Onboarding Page...');
  try {
    const pageResponse = await fetch(`${BASE_URL}/onboarding/welcome`);
    if (pageResponse.ok) {
      console.log('   ✅ Onboarding page accessible');
      console.log('   📄 Status:', pageResponse.status);
    } else {
      console.log('   ⚠️  Onboarding page returned:', pageResponse.status);
      console.log('   ℹ️  This is expected if not authenticated');
    }
  } catch (error) {
    console.log('   ❌ Error accessing page:', error.message);
  }

  // Test 3: Check API endpoint structure
  console.log('\n3️⃣ Testing API Endpoints...');
  const endpoints = [
    '/api/qr-code/generate',
    '/api/crowd-request/create-event',
    '/api/organizations/update-onboarding'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      // We expect 401 or 400 (auth/validation errors), not 404
      if (response.status === 404) {
        console.log(`   ❌ ${endpoint} - Not found (404)`);
      } else {
        console.log(`   ✅ ${endpoint} - Exists (${response.status})`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint} - Error: ${error.message}`);
    }
  }

  console.log('\n✅ Test Summary:');
  console.log('   - QR Code API: Tested');
  console.log('   - Onboarding Page: Checked');
  console.log('   - API Endpoints: Verified');
  console.log('\n📝 Next Steps:');
  console.log('   1. Sign up at http://localhost:3003/signin/signup');
  console.log('   2. You\'ll be redirected to /onboarding/welcome');
  console.log('   3. Test the wizard flow in your browser');
  console.log('   4. Check browser console for any errors');
}

// Run tests
testOnboarding().catch(console.error);


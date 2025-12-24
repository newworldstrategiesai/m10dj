#!/usr/bin/env node
/**
 * Quick verification script for bidding system setup
 * Checks critical environment variables and endpoints
 */

const https = require('https');

const CRON_SECRET = process.env.CRON_SECRET || 'f26cb6f8bccddac242fe175d212c3fc85a1467d07474d598018c526ae676c91c';
const PRODUCTION_URL = 'https://www.m10djcompany.com';

const checks = {
  cronEndpoint: false,
  environmentVariables: {
    CRON_SECRET: !!process.env.CRON_SECRET,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
  }
};

console.log('🔍 Verifying Bidding System Setup...\n');

// Test cron endpoint
function testCronEndpoint() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.m10djcompany.com',
      path: '/api/cron/process-bidding-rounds',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          checks.cronEndpoint = true;
          console.log('✅ Cron endpoint: Working');
          try {
            const json = JSON.parse(data);
            console.log(`   Response: ${json.message || 'Success'}`);
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 50)}...`);
          }
        } else {
          console.log(`❌ Cron endpoint: Failed (HTTP ${res.statusCode})`);
          console.log(`   Response: ${data.substring(0, 100)}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Cron endpoint: Error - ${error.message}`);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log('❌ Cron endpoint: Timeout');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log('\n📋 Environment Variables:');
  const envVars = checks.environmentVariables;
  
  Object.entries(envVars).forEach(([key, value]) => {
    if (value) {
      console.log(`   ✅ ${key}: Set`);
    } else {
      console.log(`   ❌ ${key}: Missing`);
    }
  });
}

// Main
async function main() {
  console.log('Testing cron endpoint...');
  await testCronEndpoint();
  
  checkEnvironmentVariables();
  
  console.log('\n📊 Summary:');
  const allEnvSet = Object.values(checks.environmentVariables).every(v => v);
  const allChecks = checks.cronEndpoint && allEnvSet;
  
  if (allChecks) {
    console.log('✅ All critical checks passed!');
    console.log('\nNext steps:');
    console.log('1. Verify Stripe webhook is configured');
    console.log('2. Verify cron-job.org is running');
    console.log('3. Run end-to-end test');
    console.log('4. Review SHIPPING_CHECKLIST_BIDDING.md');
  } else {
    console.log('⚠️  Some checks failed. Please review above.');
    if (!checks.cronEndpoint) {
      console.log('   - Fix cron endpoint authentication');
    }
    if (!allEnvSet) {
      console.log('   - Set missing environment variables in Vercel');
    }
  }
  
  console.log('\nFor detailed checklist, see: SHIPPING_CHECKLIST_BIDDING.md');
}

main().catch(console.error);


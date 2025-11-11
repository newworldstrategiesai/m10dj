#!/usr/bin/env node

/**
 * Check Resend Account Status
 * Helps diagnose why emails aren't being delivered
 */

// Load environment variables
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
} catch (error) {
  console.error('Could not load .env.local:', error.message);
  process.exit(1);
}

const checkResendStatus = async () => {
  console.log('================================================');
  console.log('Resend Account Status Check');
  console.log('================================================\n');

  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found in environment');
    process.exit(1);
  }

  const apiKey = process.env.RESEND_API_KEY;
  console.log(`✅ API Key found: ${apiKey.substring(0, 8)}...`);

  try {
    const { Resend } = require('resend');
    const resend = new Resend(apiKey);

    console.log('\n1️⃣  Checking Domains...\n');
    
    try {
      // Try to list domains (requires API support)
      console.log('   Attempting to fetch verified domains...');
      
      // Send a test email to see what happens
      console.log('\n2️⃣  Sending Test Email...\n');
      
      const testResult = await resend.emails.send({
        from: 'M10 DJ Company <hello@m10djcompany.com>',
        to: ['djbenmurray@gmail.com'],
        subject: '🔍 Diagnostic: Email Delivery Test',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #fcba00;">Email Delivery Diagnostic</h2>
            <p>This email was sent to diagnose delivery issues.</p>
            <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
            <p><strong>From:</strong> onboarding@resend.dev (TEST DOMAIN)</p>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Using Test Domain</strong><br>
                This is Resend's test domain. For production, you need to:
                <ol>
                  <li>Add your own domain in Resend</li>
                  <li>Verify DNS records</li>
                  <li>Update from address in code</li>
                </ol>
              </p>
            </div>
            
            <p>If you received this email, the Resend API is working,
            but you should still set up a custom domain for better deliverability.</p>
          </div>
        `
      });

      if (testResult.error) {
        console.log(`   ❌ Test email failed: ${testResult.error.message}`);
        console.log(`   Full error:`, testResult.error);
      } else {
        console.log(`   ✅ Test email sent!`);
        console.log(`   Email ID: ${testResult.id || testResult.data?.id}`);
        console.log(`   \n   📧 Check djbenmurray@gmail.com (including spam folder)`);
      }

    } catch (domainError) {
      console.log('   ⚠️  Could not fetch domain info:', domainError.message);
    }

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    console.log(`\nFull error:`, error);
  }

  console.log('\n================================================');
  console.log('Diagnosis Complete');
  console.log('================================================\n');

  console.log('📋 Action Items:\n');
  console.log('1. Check if test email arrived in djbenmurray@gmail.com');
  console.log('   - Check inbox');
  console.log('   - Check spam/junk folder');
  console.log('   - Check "Updates" or "Promotions" tabs\n');
  
  console.log('2. Set up custom domain in Resend:');
  console.log('   - Go to: https://resend.com/domains');
  console.log('   - Add m10djcompany.com');
  console.log('   - Verify DNS records');
  console.log('   - Update from address in code\n');
  
  console.log('3. If test email didn\'t arrive:');
  console.log('   - Check Resend dashboard: https://resend.com/emails');
  console.log('   - Look for rate limit errors');
  console.log('   - Verify API key is active\n');
};

checkResendStatus()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });


#!/usr/bin/env node

/**
 * Notification Test Script
 * Tests both email (Resend) and SMS (Twilio) notifications
 */

// Load environment variables from .env.local
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
}

const testNotifications = async () => {
  console.log('================================================');
  console.log('Lead Form Notification Test');
  console.log('================================================\n');

  // Check configuration
  console.log('1️⃣  Checking Configuration...\n');
  
  const config = {
    resend: !!process.env.RESEND_API_KEY,
    twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
    adminPhone: !!process.env.ADMIN_PHONE_NUMBER
  };

  console.log(`   Resend API Key: ${config.resend ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Twilio Credentials: ${config.twilio ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Admin Phone: ${config.adminPhone ? '✅ Configured' : '❌ Missing'}`);
  
  if (!config.resend) {
    console.log('\n   ⚠️  Email notifications will not work - RESEND_API_KEY missing');
  }
  
  if (!config.twilio || !config.adminPhone) {
    console.log('\n   ⚠️  SMS notifications will not work - Twilio credentials or admin phone missing');
  }

  console.log('\n2️⃣  Testing Email (Resend)...\n');
  
  if (config.resend) {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const testEmail = await resend.emails.send({
        from: 'M10 DJ Company <hello@m10djcompany.com>',
        to: ['djbenmurray@gmail.com'],
        subject: '🧪 Test: Lead Form Notification System',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #fcba00;">✅ Email Notification Test</h2>
            <p>This is a test email from your lead form notification system.</p>
            <p><strong>Status:</strong> <span style="color: green;">Working correctly!</span></p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Test conducted: ${new Date().toLocaleString()}<br>
              If you received this email, your email notifications are working properly.
            </p>
          </div>
        `
      });
      
      console.log(`   ✅ Email sent successfully!`);
      console.log(`   Email ID: ${testEmail.id}`);
      console.log(`   Recipient: djbenmurray@gmail.com`);
    } catch (emailError) {
      console.log(`   ❌ Email failed: ${emailError.message}`);
      console.log(`   Details: ${emailError.stack}`);
    }
  } else {
    console.log('   ⏭️  Skipped - Resend not configured');
  }

  console.log('\n3️⃣  Testing SMS (Twilio)...\n');
  
  if (config.twilio && config.adminPhone) {
    try {
      const twilio = require('twilio');
      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      const testSMS = await twilioClient.messages.create({
        body: '🧪 Test: Lead Form SMS notifications are working! This is a test message from your M10 DJ notification system.',
        from: process.env.TWILIO_PHONE_NUMBER,
        to: process.env.ADMIN_PHONE_NUMBER
      });
      
      console.log(`   ✅ SMS sent successfully!`);
      console.log(`   Message SID: ${testSMS.sid}`);
      console.log(`   From: ${testSMS.from}`);
      console.log(`   To: ${process.env.ADMIN_PHONE_NUMBER}`);
      console.log(`   Status: ${testSMS.status}`);
    } catch (smsError) {
      console.log(`   ❌ SMS failed: ${smsError.message}`);
      console.log(`   Details: ${smsError.stack}`);
    }
  } else {
    console.log('   ⏭️  Skipped - Twilio or admin phone not configured');
  }

  console.log('\n4️⃣  Testing Live Submission...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Notification System Test',
        email: 'test-notifications@example.com',
        phone: '9015559999',
        eventType: 'Wedding',
        eventDate: '2026-06-15',
        location: 'Memphis, TN',
        message: 'This is an automated test to verify notifications are sent with lead form submissions.'
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`   ✅ Form submission successful!`);
      console.log(`   Submission ID: ${result.submissionId}`);
      console.log(`   Contact ID: ${result.contactId}`);
      console.log(`\n   📧 Check your email for customer confirmation + admin notification`);
      console.log(`   📱 Check your phone for SMS notification`);
    } else {
      console.log(`   ❌ Form submission failed`);
      console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    }
  } catch (submissionError) {
    console.log(`   ❌ Submission failed: ${submissionError.message}`);
  }

  console.log('\n================================================');
  console.log('Test Complete!');
  console.log('================================================\n');
  
  console.log('Summary:');
  console.log(`- Email system: ${config.resend ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`- SMS system: ${config.twilio && config.adminPhone ? '✅ Ready' : '❌ Not configured'}`);
  console.log('\nNext steps:');
  console.log('1. Check djbenmurray@gmail.com for test emails');
  console.log(`2. Check ${process.env.ADMIN_PHONE_NUMBER || 'your phone'} for test SMS`);
  console.log('3. Review server logs for any errors\n');
};

// Run the test
testNotifications()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });


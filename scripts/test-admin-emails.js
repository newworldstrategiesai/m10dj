#!/usr/bin/env node

/**
 * Test Admin Email Delivery
 * Specifically tests if emails are reaching m10djcompany@gmail.com
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

const testAdminEmails = async () => {
  console.log('================================================');
  console.log('Testing Admin Email Delivery');
  console.log('================================================\n');

  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found');
    process.exit(1);
  }

  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const adminEmails = [
    'djbenmurray@gmail.com',
    'm10djcompany@gmail.com'
  ];

  console.log('📧 Testing email delivery to admin addresses:\n');
  
  for (const email of adminEmails) {
    console.log(`Testing: ${email}`);
    
    try {
      const result = await resend.emails.send({
        from: 'M10 DJ Company <hello@m10djcompany.com>',
        to: [email],
        subject: `🧪 Admin Email Test - ${new Date().toLocaleTimeString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: #fcba00; padding: 20px; border-radius: 8px;">
              <h2 style="color: #000; margin: 0;">✅ Email Delivery Test</h2>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; margin-top: 20px; border-radius: 8px;">
              <p style="margin: 0;"><strong>To:</strong> ${email}</p>
              <p style="margin: 5px 0 0 0;"><strong>From:</strong> hello@m10djcompany.com</p>
              <p style="margin: 5px 0 0 0;"><strong>Time:</strong> ${new Date().toISOString()}</p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
              <p style="margin: 0; color: #2e7d32;">
                <strong>✅ Success!</strong><br>
                If you're reading this, emails are being delivered to ${email}.
              </p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px;">
                <strong>Note:</strong> If this email is in your spam/junk folder, please mark it as "Not Spam" 
                and add hello@m10djcompany.com to your contacts.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                This is a test email from your lead form notification system.<br>
                M10 DJ Company - Lead Notification System
              </p>
            </div>
          </div>
        `
      });

      if (result.error) {
        console.log(`   ❌ FAILED: ${result.error.message}\n`);
      } else {
        console.log(`   ✅ SENT! Email ID: ${result.id || result.data?.id}`);
        console.log(`   📬 Check ${email} inbox (and spam folder)\n`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
    }
  }

  console.log('================================================');
  console.log('Test Complete');
  console.log('================================================\n');
  
  console.log('📋 Next Steps:\n');
  console.log('1. Check BOTH email inboxes:');
  console.log('   - djbenmurray@gmail.com');
  console.log('   - m10djcompany@gmail.com\n');
  
  console.log('2. Check spam/junk folders in both accounts\n');
  
  console.log('3. If m10djcompany@gmail.com is NOT receiving:');
  console.log('   - Verify the email account exists and can receive emails');
  console.log('   - Check if inbox is full');
  console.log('   - Add hello@m10djcompany.com to contacts');
  console.log('   - Check Gmail filters/forwarding rules\n');
  
  console.log('4. If in spam, mark as "Not Spam" and add to contacts\n');
};

testAdminEmails()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });


#!/usr/bin/env node

/**
 * Script to configure Supabase Auth SMTP settings using Resend
 * 
 * Usage:
 *   node scripts/configure-supabase-smtp.js
 * 
 * Required environment variables:
 *   - SUPABASE_ACCESS_TOKEN: Your Supabase access token (from dashboard)
 *   - SUPABASE_PROJECT_REF: Your project reference (bwayphqnxgcyjpoaautn)
 *   - RESEND_API_KEY: Your Resend API key
 *   - SMTP_SENDER_EMAIL: Email address to send from (e.g., hello@m10djcompany.com)
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'bwayphqnxgcyjpoaautn';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SMTP_SENDER_EMAIL = process.env.SMTP_SENDER_EMAIL || 'hello@m10djcompany.com';
const SMTP_SENDER_NAME = process.env.SMTP_SENDER_NAME || 'M10 DJ Company';

// Resend SMTP settings
// Port options: 587 (STARTTLS - recommended), 465 (SMTPS/SSL), 25, 2465, 2587
const SMTP_HOST = 'smtp.resend.com';
const SMTP_PORT = 587; // Use 465 for SMTPS/SSL if needed
const SMTP_USER = 'resend'; // Always 'resend', password is your API key

async function configureSupabaseSMTP() {
  console.log('🚀 Configuring Supabase Auth SMTP with Resend...\n');

  // Validate required environment variables
  if (!SUPABASE_ACCESS_TOKEN) {
    console.error('❌ Error: SUPABASE_ACCESS_TOKEN is required');
    console.error('   Get it from: https://supabase.com/dashboard/account/tokens\n');
    process.exit(1);
  }

  if (!RESEND_API_KEY) {
    console.error('❌ Error: RESEND_API_KEY is required');
    console.error('   Get it from: https://resend.com/api-keys\n');
    process.exit(1);
  }

  if (!RESEND_API_KEY.startsWith('re_')) {
    console.error('❌ Error: RESEND_API_KEY should start with "re_"');
    console.error('   Verify your API key is correct\n');
    process.exit(1);
  }

    console.log('✅ Environment variables validated');
    console.log(`   Project: ${SUPABASE_PROJECT_REF}`);
    console.log(`   SMTP Host: ${SMTP_HOST}`);
    console.log(`   SMTP Port: ${SMTP_PORT} (STARTTLS)`);
    console.log(`   SMTP User: ${SMTP_USER}`);
    console.log(`   Sender: ${SMTP_SENDER_NAME} <${SMTP_SENDER_EMAIL}>\n`);
    console.log('💡 Tip: If port 587 doesn\'t work, try 465 (SMTPS/SSL) or 25 (STARTTLS)\n');

  // Prepare configuration payload
  const config = {
    external_email_enabled: true,
    mailer_secure_email_change_enabled: true,
    mailer_autoconfirm: false,
    smtp_admin_email: SMTP_SENDER_EMAIL,
    smtp_host: SMTP_HOST,
    smtp_port: SMTP_PORT,
    smtp_user: SMTP_USER,
    smtp_pass: RESEND_API_KEY,
    smtp_sender_name: SMTP_SENDER_NAME
  };

  try {
    console.log('📡 Sending configuration to Supabase...');
    
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to configure SMTP');
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Error: ${errorText}\n`);
      process.exit(1);
    }

    const result = await response.json();
    
    console.log('✅ SMTP configuration successful!\n');
    console.log('📋 Configuration Summary:');
    console.log(`   ✅ Custom SMTP: Enabled`);
    console.log(`   ✅ SMTP Host: ${SMTP_HOST}`);
    console.log(`   ✅ SMTP Port: ${SMTP_PORT}`);
    console.log(`   ✅ Sender Email: ${SMTP_SENDER_EMAIL}`);
    console.log(`   ✅ Sender Name: ${SMTP_SENDER_NAME}\n`);

    console.log('🎯 Next Steps:');
    console.log('   1. Test email sending (password reset, magic link, etc.)');
    console.log('   2. Verify domain in Resend dashboard (if not already done)');
    console.log('   3. Adjust rate limits in Supabase Dashboard → Authentication → Rate Limits');
    console.log('   4. Monitor email deliverability in Resend dashboard\n');

    console.log('📚 Documentation:');
    console.log('   - Setup Guide: SUPABASE_AUTH_SMTP_SETUP.md');
    console.log('   - Resend Dashboard: https://resend.com/emails');
    console.log('   - Supabase Auth Settings: https://supabase.com/dashboard/project/' + SUPABASE_PROJECT_REF + '/auth/settings\n');

  } catch (error) {
    console.error('❌ Error configuring SMTP:', error.message);
    console.error('\nTroubleshooting:');
    console.error('   1. Verify SUPABASE_ACCESS_TOKEN is valid');
    console.error('   2. Check that RESEND_API_KEY is correct');
    console.error('   3. Ensure project reference is correct');
    console.error('   4. Try configuring via Supabase Dashboard instead\n');
    process.exit(1);
  }
}

// Run the configuration
configureSupabaseSMTP();


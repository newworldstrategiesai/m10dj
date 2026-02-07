#!/usr/bin/env node

/**
 * Test song request (crowd request) SMS notification programmatically.
 * Sends the same SMS the admin would get when a guest pays for a song request.
 * Loads .env.local and calls sendAdminNotification('crowd_request_payment', mockData).
 *
 * Run from project root: node scripts/test-song-request-sms.js
 */

const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
} catch (err) {
  console.error('Could not load .env.local:', err.message);
  process.exit(1);
}

// Same message format as utils/admin-notifications.js crowd_request_payment case
function buildSongRequestSMS(data) {
  return `🎵 SONG REQUEST PAID\n\n${data.requestDetail || 'Request'}\nFrom: ${data.requesterName || 'Guest'}\nAmount: $${typeof data.amount === 'number' ? data.amount.toFixed(2) : data.amount || '0'}\nEvent: ${data.eventCode || '—'}\n${data.paymentIntentId ? `Stripe: ${data.paymentIntentId}` : ''}`.trim();
}

async function main() {
  console.log('================================================');
  console.log('Song Request SMS Notification Test');
  console.log('================================================\n');

  if (!process.env.ADMIN_PHONE_NUMBER) {
    console.log('❌ ADMIN_PHONE_NUMBER not set in .env.local');
    process.exit(1);
  }
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('❌ Twilio not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)');
    process.exit(1);
  }

  const mockData = {
    requestDetail: 'Bohemian Rhapsody – Queen',
    requesterName: 'Test Guest',
    amount: 5.0,
    eventCode: 'TEST-EVENT',
    paymentIntentId: 'pi_test_programmatic',
  };

  const message = buildSongRequestSMS(mockData);
  console.log('SMS body (same format as crowd_request_payment):\n');
  console.log(message);
  console.log('\n---\n');

  // 1) Send via Twilio directly so a real SMS is sent
  const twilio = require('twilio');
  const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  try {
    const sms = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.ADMIN_PHONE_NUMBER.replace(/\D/g, '').length === 10 ? `+1${process.env.ADMIN_PHONE_NUMBER.replace(/\D/g, '')}` : process.env.ADMIN_PHONE_NUMBER,
    });
    console.log('✅ SMS sent via Twilio');
    console.log('   SID:', sms.sid);
    console.log('   To:', process.env.ADMIN_PHONE_NUMBER);
  } catch (err) {
    console.error('❌ Twilio SMS failed:', err.message);
    process.exit(1);
  }

  // 2) Optionally fire the full notification (email + DB log) – may warn in ESM
  console.log('\nTriggering full sendAdminNotification (email + log)...');
  const { sendAdminNotification } = await import('../utils/admin-notifications.js');
  await sendAdminNotification('crowd_request_payment', mockData);
  console.log('✅ sendAdminNotification completed. Check email and admin phone.\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });

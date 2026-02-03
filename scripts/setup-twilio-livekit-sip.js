#!/usr/bin/env node
/**
 * Setup Twilio Elastic SIP Trunk for LiveKit voice calling (M10 DJ Company).
 * Uses TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from .env.local (or .env).
 *
 * Creates:
 * - Elastic SIP Trunk (domain: m10dj-livekit.pstn.twilio.com)
 * - SIP Credential List + one credential (for LiveKit outbound auth)
 * - Origination URL pointing to your LiveKit SIP endpoint (inbound)
 * - Associates your Twilio phone number with the trunk (if M10DJ_TWILIO_PHONE_NUMBER set)
 *
 * After running: create the outbound trunk in LiveKit (dashboard or CLI) using
 * the printed address, numbers, authUsername, and authPassword; then set
 * LIVEKIT_SIP_OUTBOUND_TRUNK_ID in .env.local.
 *
 * Usage: node scripts/setup-twilio-livekit-sip.js
 *        TWILIO_SIP_USERNAME and TWILIO_SIP_PASSWORD optional (script generates if missing)
 *        LIVEKIT_SIP_URI optional (derived from LIVEKIT_URL if set)
 */

const path = require('path');
const fs = require('fs');

// Load .env first, then .env.local so .env.local wins (where you usually keep Twilio)
const envFile = path.join(process.cwd(), '.env');
const envLocal = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
}
if (fs.existsSync(envLocal)) {
  require('dotenv').config({ path: envLocal });
}

const twilio = require('twilio');

function stripEnv(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/^["'\s]+|["'\s]+$/g, '').trim();
}

const TWILIO_ACCOUNT_SID = stripEnv(process.env.TWILIO_ACCOUNT_SID);
const TWILIO_AUTH_TOKEN = stripEnv(process.env.TWILIO_AUTH_TOKEN);
const M10DJ_PHONE = stripEnv(process.env.M10DJ_TWILIO_PHONE_NUMBER);
const LIVEKIT_URL = stripEnv(process.env.LIVEKIT_URL);
const LIVEKIT_SIP_URI = stripEnv(process.env.LIVEKIT_SIP_URI);
let TWILIO_SIP_USERNAME = stripEnv(process.env.TWILIO_SIP_USERNAME);
let TWILIO_SIP_PASSWORD = stripEnv(process.env.TWILIO_SIP_PASSWORD);
const TWILIO_TRUNK_DOMAIN = stripEnv(process.env.TWILIO_TRUNK_DOMAIN);

function randomStrongPassword(length = 16) {
  const lowers = 'abcdefghijklmnopqrstuvwxyz';
  const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const all = lowers + uppers + digits;
  const pick = (charset) => charset[Math.floor(Math.random() * charset.length)];
  const required = [pick(lowers), pick(uppers), pick(digits)];
  let rest = '';
  for (let i = required.length; i < length; i++) {
    rest += pick(all);
  }
  const combined = (required.join('') + rest).split('');
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join('');
}

function validateStrongPassword(password) {
  if (!password || password.length < 12) return false;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  return hasLower && hasUpper && hasDigit;
}

function deriveLiveKitSipUri() {
  if (LIVEKIT_SIP_URI) {
    return LIVEKIT_SIP_URI.startsWith('sip:') ? LIVEKIT_SIP_URI : `sip:${LIVEKIT_SIP_URI}`;
  }
  if (!LIVEKIT_URL) {
    return null;
  }
  // wss://tip-jar-eqd4nnqw.livekit.cloud -> sip:tip-jar-eqd4nnqw.sip.livekit.cloud
  try {
    const u = new URL(LIVEKIT_URL);
    const host = u.hostname; // e.g. tip-jar-eqd4nnqw.livekit.cloud
    const base = host.replace(/\.livekit\.cloud$/, '');
    return `sip:${base}.sip.livekit.cloud`;
  } catch {
    return null;
  }
}

function randomAlphanumeric(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function main() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN. Set them in .env.local (or .env).');
    process.exit(1);
  }

  // Use Account SID (AC...), not API Key SID (SK...). Auth Token is the primary account token from Console.
  if (!TWILIO_ACCOUNT_SID.startsWith('AC')) {
    console.error('TWILIO_ACCOUNT_SID should start with AC (Account SID from Console). If you use an API Key (SK...), use the main Account SID and Auth Token instead.');
    process.exit(1);
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  try {
    await client.api.v2010.account.fetch();
  } catch (err) {
    if (err.status === 401) {
      console.error('Twilio rejected the credentials (401). Check:');
      console.error('  - TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.local (this file overrides .env now)');
      console.error('  - No extra quotes, spaces, or newlines in the token');
      console.error('  - Auth token is the live "Auth Token" from Console → Account → API keys & tokens (regenerate if unsure)');
      process.exit(1);
    }
    throw err;
  }

  const sipUrl = deriveLiveKitSipUri();
  if (!sipUrl) {
    console.error('Could not determine LiveKit SIP URI. Set LIVEKIT_SIP_URI (e.g. sip:your-project.sip.livekit.cloud) or LIVEKIT_URL (e.g. wss://your-project.livekit.cloud) in .env.local.');
    process.exit(1);
  }

  if (!TWILIO_SIP_USERNAME) TWILIO_SIP_USERNAME = `livekit-${randomAlphanumeric(8)}`;
  if (!TWILIO_SIP_PASSWORD) TWILIO_SIP_PASSWORD = randomStrongPassword();

  if (!validateStrongPassword(TWILIO_SIP_PASSWORD)) {
    console.error('TWILIO_SIP_PASSWORD must be at least 12 chars and include lowercase, uppercase, and digits (Twilio requirement).');
    process.exit(1);
  }

  const trunkDomain = TWILIO_TRUNK_DOMAIN || 'm10dj-livekit.pstn.twilio.com';

  console.log('Creating (or reusing) Twilio Elastic SIP Trunk for LiveKit...\n');

  // 1. Create trunk (or reuse if it already exists)
  const existingTrunks = await client.trunking.v1.trunks.list({ limit: 200 });
  const existing = existingTrunks.find((t) => t.domainName === trunkDomain);
  const trunk = existing
    ? existing
    : await client.trunking.v1.trunks.create({
        friendlyName: 'M10 DJ LiveKit SIP',
        domainName: trunkDomain,
      });
  console.log(existing ? 'Reusing trunk:' : 'Created trunk:', trunk.sid, trunk.domainName);

  // 2. Create (or reuse) SIP credential list (account-level)
  const allCredLists = await client.sip.credentialLists.list({ limit: 200 });
  const existingCredList = allCredLists.find((cl) => cl.friendlyName === 'LiveKit Outbound (M10 DJ)');
  const credList = existingCredList
    ? existingCredList
    : await client.sip.credentialLists.create({
        friendlyName: 'LiveKit Outbound (M10 DJ)',
      });
  console.log(existingCredList ? 'Reusing credential list:' : 'Created credential list:', credList.sid);

  // 3. Add credential to list
  const existingCreds = await client.sip.credentialLists(credList.sid).credentials.list({ limit: 200 });
  const credMatch = existingCreds.find((cred) => cred.username === TWILIO_SIP_USERNAME);
  if (!credMatch) {
    await client.sip.credentialLists(credList.sid).credentials.create({
      username: TWILIO_SIP_USERNAME,
      password: TWILIO_SIP_PASSWORD,
    });
    console.log('Added credential:', TWILIO_SIP_USERNAME);
  } else {
    console.log('Credential already exists:', TWILIO_SIP_USERNAME);
  }

  // 4. Associate credential list with trunk
  const trunkCredLists = await client.trunking
    .v1.trunks(trunk.sid)
    .credentialLists
    .list({ limit: 200 });
  const hasCredList = trunkCredLists.some((cl) => cl.sid === credList.sid || cl.friendlyName === credList.friendlyName);
  if (!hasCredList) {
    await client.trunking.v1.trunks(trunk.sid).credentialLists.create({
      credentialListSid: credList.sid,
    });
    console.log('Associated credential list with trunk');
  } else {
    console.log('Credential list already associated with trunk');
  }

  // 5. Add origination URL (inbound -> LiveKit)
  const trunkOriginationUrls = await client.trunking
    .v1.trunks(trunk.sid)
    .originationUrls
    .list({ limit: 200 });
  const hasOrigination = trunkOriginationUrls.some((o) => o.sipUrl === sipUrl);
  if (!hasOrigination) {
    await client.trunking.v1.trunks(trunk.sid).originationUrls.create({
      friendlyName: 'LiveKit SIP URI',
      sipUrl,
      weight: 1,
      priority: 1,
      enabled: true,
    });
    console.log('Added origination URL:', sipUrl);
  } else {
    console.log('Origination URL already exists:', sipUrl);
  }

  // 6. Associate phone number if provided
  if (M10DJ_PHONE) {
    const normalized = M10DJ_PHONE.replace(/\D/g, '');
    const numbers = await client.api.v2010.account.incomingPhoneNumbers.list({ limit: 200 });
    const match = numbers.find((n) => n.phoneNumber && n.phoneNumber.replace(/\D/g, '') === normalized);
    if (match) {
      const trunkNumbers = await client.trunking
        .v1.trunks(trunk.sid)
        .phoneNumbers
        .list({ limit: 200 });
      const hasNumber = trunkNumbers.some((n) => n.sid === match.sid || n.phoneNumber === match.phoneNumber);
      if (!hasNumber) {
        await client.trunking.v1.trunks(trunk.sid).phoneNumbers.create({
          phoneNumberSid: match.sid,
        });
        console.log('Associated phone number:', match.phoneNumber);
      } else {
        console.log('Phone number already associated with trunk:', match.phoneNumber);
      }
    } else {
      console.warn('Phone number', M10DJ_PHONE, 'not found in your Twilio account. Associate it manually in Twilio Console: Elastic SIP Trunking → Trunks →', trunk.sid, '→ Phone Numbers');
    }
  } else {
    console.warn('M10DJ_TWILIO_PHONE_NUMBER not set. Associate your Twilio number to this trunk in Console: Elastic SIP Trunking → Trunks →', trunk.sid);
  }

  console.log('\n--- Twilio SIP trunk ready ---\n');
  console.log('Use these values when creating the LiveKit OUTBOUND trunk (dashboard or CLI):\n');
  console.log('  Address (Twilio trunk domain):', trunkDomain);
  console.log('  Numbers (caller ID):          ', M10DJ_PHONE || '<your E.164 number>');
  console.log('  Auth username:                ', TWILIO_SIP_USERNAME);
  console.log('  Auth password:                ', TWILIO_SIP_PASSWORD);
  console.log('\nOptional: add to .env.local so you can re-run or reference later:');
  console.log('  TWILIO_SIP_USERNAME=' + TWILIO_SIP_USERNAME);
  console.log('  TWILIO_SIP_PASSWORD=' + TWILIO_SIP_PASSWORD);
  console.log('\nNext steps:');
  console.log('  1. LiveKit Cloud → Telephony → SIP trunks → Create new trunk → Outbound');
  console.log('     Address:', trunkDomain);
  console.log('     Numbers: [', M10DJ_PHONE || 'your E.164', ']');
  console.log('     Auth: username =', TWILIO_SIP_USERNAME, ', password = (above)');
  console.log('  2. Copy the new outbound trunk ID and set in .env.local:');
  console.log('     LIVEKIT_SIP_OUTBOUND_TRUNK_ID=<trunk-id>');
  console.log('  3. (Optional) Create inbound trunk + dispatch rule in LiveKit for incoming calls; room names must start with inbound-');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

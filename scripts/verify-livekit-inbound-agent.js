#!/usr/bin/env node
/**
 * LiveKit Inbound Agent Diagnostic
 *
 * Verifies configuration and APIs required for the inbound AI agent to receive calls:
 * - LiveKit credentials and connectivity
 * - Agent dispatch API (createDispatch with agent name "Ben")
 * - livekit_agent_settings (agent_name, auto_answer_enabled, auto_answer_delay_seconds)
 * - Agent config URL (for Python agent)
 *
 * Inbound flow: Call → Twilio Elastic SIP → LiveKit SIP → dispatch rule creates room "inbound-*"
 * → participant_joined webhook → handleInboundSipCall + scheduleAutoAnswer → createDispatch(roomName, "Ben")
 * → Agent (Python ben_agent.py with agent_name="Ben") joins room.
 *
 * Run: node scripts/verify-livekit-inbound-agent.js
 * Requires: .env.local with LIVEKIT_*, SUPABASE_*, NEXT_PUBLIC_SUPABASE_URL
 */

const path = require('path');
const fs = require('fs');

const envLocal = path.join(process.cwd(), '.env.local');
const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envLocal)) require('dotenv').config({ path: envLocal });
if (fs.existsSync(envFile)) require('dotenv').config({ path: envFile });

const LIVEKIT_URL = (process.env.LIVEKIT_URL || '').trim();
const LIVEKIT_API_KEY = (process.env.LIVEKIT_API_KEY || '').trim();
const LIVEKIT_API_SECRET = (process.env.LIVEKIT_API_SECRET || '').trim();
const livekitHost = LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://');

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const AGENT_CONFIG_URL = (process.env.LIVEKIT_AGENT_CONFIG_URL || '').trim();
const AGENT_CONFIG_TOKEN = (process.env.LIVEKIT_AGENT_CONFIG_TOKEN || '').trim();

const results = { ok: [], fail: [], warn: [] };
function pass(msg) {
  results.ok.push(msg);
  console.log('  ✅', msg);
}
function fail(msg, detail) {
  results.fail.push(msg);
  console.log('  ❌', msg);
  if (detail) console.log('     ', detail);
}
function warn(msg) {
  results.warn.push(msg);
  console.log('  ⚠️', msg);
}

async function main() {
  console.log('\n--- LiveKit Inbound Agent Diagnostic ---\n');

  // 1. Env
  console.log('1. Environment');
  if (LIVEKIT_URL && LIVEKIT_API_KEY && LIVEKIT_API_SECRET) {
    pass('LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET set');
  } else {
    fail('Missing LiveKit env', 'Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in .env.local');
  }
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    pass('Supabase URL and service key set');
  } else {
    fail('Missing Supabase env', 'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  if (AGENT_CONFIG_URL && AGENT_CONFIG_TOKEN) {
    pass('LIVEKIT_AGENT_CONFIG_URL and LIVEKIT_AGENT_CONFIG_TOKEN set (Python agent config)');
  } else {
    warn('LIVEKIT_AGENT_CONFIG_URL or LIVEKIT_AGENT_CONFIG_TOKEN not set (Python agent will use defaults)');
  }
  console.log('');

  if (!livekitHost || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.log('Skipping LiveKit API tests (missing credentials).\n');
    printChecklist();
    return;
  }

  // 2. LiveKit connectivity (RoomServiceClient)
  console.log('2. LiveKit connectivity');
  try {
    const { RoomServiceClient } = require('livekit-server-sdk');
    const roomService = new RoomServiceClient(livekitHost, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    const rooms = await roomService.listRooms();
    pass(`LiveKit API OK (listRooms: ${rooms.length} room(s))`);
  } catch (err) {
    fail('LiveKit API error', err.message || String(err));
  }
  console.log('');

  // 3. Agent dispatch (createDispatch)
  console.log('3. Agent dispatch (createDispatch)');
  const testRoomName = `inbound-test-${Date.now()}`;
  try {
    const { RoomServiceClient, AgentDispatchClient } = require('livekit-server-sdk');
    const roomService = new RoomServiceClient(livekitHost, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    await roomService.createRoom({
      name: testRoomName,
      emptyTimeout: 60,
      maxParticipants: 4,
    });
    const dispatchClient = new AgentDispatchClient(livekitHost, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    const dispatch = await dispatchClient.createDispatch(testRoomName, 'Ben', {
      metadata: JSON.stringify({ diagnostic: true, source: 'verify-livekit-inbound-agent' }),
    });
    pass(`createDispatch(room="${testRoomName}", agentName="Ben") succeeded (dispatch id: ${dispatch.id || dispatch.dispatchId || 'n/a'})`);
    // Clean up: delete room so test room doesn't linger (optional; room will empty-timeout anyway)
    try {
      await roomService.deleteRoom(testRoomName);
    } catch (_) {}
  } catch (err) {
    const msg = err.message || String(err);
    if (msg.includes('agent') || msg.includes('Ben') || msg.includes('dispatch')) {
      fail('Agent dispatch failed (agent may not be registered or wrong name)', msg);
    } else {
      fail('Agent dispatch failed', msg);
    }
  }
  console.log('');

  // 4. livekit_agent_settings (agent_name, auto_answer)
  console.log('4. livekit_agent_settings (DB)');
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: row, error } = await supabase
        .from('livekit_agent_settings')
        .select('agent_name, auto_answer_enabled, auto_answer_delay_seconds')
        .is('organization_id', null)
        .eq('name', 'default_m10')
        .maybeSingle();
      if (error) {
        fail('Failed to read livekit_agent_settings', error.message);
      } else if (!row) {
        warn('No default_m10 row in livekit_agent_settings (agent_name will default to "Ben" in code)');
      } else {
        pass(`agent_name="${row.agent_name}", auto_answer_enabled=${row.auto_answer_enabled}, delay=${row.auto_answer_delay_seconds}s`);
        if (row.agent_name !== 'Ben') {
          warn(`Agent name in DB is "${row.agent_name}" but Python agent registers as "Ben"; they must match for dispatch.`);
        }
        if (row.auto_answer_enabled === false) {
          warn('auto_answer_enabled is false; agent will not be dispatched on inbound SIP (only admin notification).');
        }
      }
    } catch (err) {
      fail('Supabase livekit_agent_settings', err.message || String(err));
    }
  } else {
    warn('Skipping livekit_agent_settings (no Supabase env)');
  }
  console.log('');

  // 5. Agent config URL (optional)
  if (AGENT_CONFIG_URL && AGENT_CONFIG_TOKEN) {
    console.log('5. Agent config URL (GET)');
    try {
      const res = await fetch(AGENT_CONFIG_URL, {
        headers: { Authorization: `Bearer ${AGENT_CONFIG_TOKEN}` },
      });
      if (res.ok) {
        pass(`GET ${AGENT_CONFIG_URL} → ${res.status}`);
      } else {
        warn(`GET ${AGENT_CONFIG_URL} → ${res.status} (agent will use defaults if not 200)`);
      }
    } catch (err) {
      warn(`Agent config URL fetch failed: ${err.message}`);
    }
    console.log('');
  }

  printChecklist();
}

function printChecklist() {
  console.log('--- Inbound agent checklist ---');
  console.log('1. Inbound calls must reach LiveKit SIP (Twilio Elastic SIP → LiveKit), not Twilio Programmable Voice.');
  console.log('2. In LiveKit Cloud: SIP dispatch rule must create rooms with name prefix "inbound-" (e.g. inbound-<caller>-<ts>).');
  console.log('3. LiveKit webhook URL must be set to: https://<your-domain>/api/livekit/webhook');
  console.log('4. Python agent (agents/ben_agent.py) must be running and registered with agent_name="Ben".');
  console.log('5. livekit_agent_settings.default_m10.agent_name must match the agent (e.g. "Ben").');
  console.log('6. auto_answer_enabled should be true if you want the agent to answer when no admin answers.');
  console.log('');
  const failed = results.fail.length;
  const warned = results.warn.length;
  if (failed > 0) {
    console.log(`Result: ${failed} failure(s), ${results.ok.length} check(s) passed. Fix failures above.`);
    process.exitCode = 1;
  } else {
    console.log(`Result: All critical checks passed. ${warned} warning(s).`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});

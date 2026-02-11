import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

/**
 * POST /api/livekit/agent-send-sms
 *
 * Sends an SMS to the caller on the current LiveKit voice call (or to a given number).
 * Called by the LiveKit voice agent (e.g. Ben) so it can text the user during or after a call.
 *
 * Auth: Bearer token must match AGENT_SMS_SECRET or LIVEKIT_AGENT_CONFIG_TOKEN.
 *
 * Body:
 *   - roomName: string (optional) – Look up voice_calls by room_name and send to client_phone.
 *   - to: string (optional) – E.164 number to send to. Use when not sending by room.
 *   - body: string – SMS message text.
 *
 * One of roomName or to is required. For inbound/outbound calls, use roomName so the SMS
 * goes to the caller on that call.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token =
    process.env.AGENT_SMS_SECRET || process.env.LIVEKIT_AGENT_CONFIG_TOKEN;
  if (!token || authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let json: { roomName?: string; to?: string; body?: string };
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { roomName, to: toParam, body: bodyParam } = json;
  const messageBody = typeof bodyParam === 'string' ? bodyParam.trim() : '';
  if (!messageBody) {
    return NextResponse.json(
      { error: 'Missing or empty body (message text)' },
      { status: 400 }
    );
  }

  let toNumber: string | null = null;

  if (roomName && typeof roomName === 'string') {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: call, error } = await supabase
      .from('voice_calls')
      .select('client_phone')
      .eq('room_name', roomName.trim())
      .maybeSingle();

    if (error) {
      console.error('[agent-send-sms] voice_calls lookup:', error);
      return NextResponse.json(
        { error: 'Failed to look up call', message: error.message },
        { status: 500 }
      );
    }
    const phone = (call as { client_phone?: string | null } | null)?.client_phone;
    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: 'No client phone number for this room' },
        { status: 404 }
      );
    }
    toNumber = phone.trim();
  } else if (toParam && typeof toParam === 'string' && toParam.trim()) {
    toNumber = toParam.trim();
  }

  if (!toNumber) {
    return NextResponse.json(
      { error: 'Provide either roomName (to text the caller on that call) or to (E.164 number)' },
      { status: 400 }
    );
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber =
    process.env.M10DJ_TWILIO_PHONE_NUMBER?.trim() ||
    process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!twilioSid || !twilioAuth || !fromNumber) {
    return NextResponse.json(
      {
        error: 'Twilio not configured',
        details: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER or M10DJ_TWILIO_PHONE_NUMBER',
      },
      { status: 500 }
    );
  }

  try {
    const client = twilio(twilioSid, twilioAuth);
    const message = await client.messages.create({
      body: messageBody,
      from: fromNumber,
      to: toNumber,
    });
    return NextResponse.json({
      success: true,
      messageSid: message.sid,
      to: toNumber,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[agent-send-sms] Twilio error:', err);
    return NextResponse.json(
      { error: 'Failed to send SMS', message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/livekit/agent-session-end
 *
 * Called by the LiveKit agent (Ben) at end of call with job/session summary.
 * Auth: Bearer token must match LIVEKIT_AGENT_CONFIG_TOKEN or END_OF_CALL_WEBHOOK_SECRET.
 * Updates voice_calls.agent_summary when room_name matches an inbound-* / outbound-* call.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token =
    process.env.END_OF_CALL_WEBHOOK_SECRET || process.env.LIVEKIT_AGENT_CONFIG_TOKEN;
  if (!token || authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    job_id?: string;
    room_id?: string;
    room?: string;
    started_at?: string | null;
    ended_at?: string | null;
    summary?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const roomName = body.room || body.room_id;
  if (!roomName || typeof roomName !== 'string') {
    return NextResponse.json({ error: 'room or room_id required' }, { status: 400 });
  }

  const summary =
    typeof body.summary === 'string' && body.summary.trim()
      ? body.summary.trim()
      : null;
  if (!summary) {
    return NextResponse.json({ received: true, updated: false });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('voice_calls')
    .update({
      agent_summary: summary,
      updated_at: new Date().toISOString(),
    })
    .eq('room_name', roomName);

  if (error) {
    console.error('[agent-session-end] update voice_calls:', error);
    return NextResponse.json(
      { error: 'Failed to update', message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true, updated: true });
}

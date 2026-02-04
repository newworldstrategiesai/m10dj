import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';
import { soloMeetParticipant, clearMeetSolo } from '@/utils/livekit/meet-mute';

/**
 * POST /api/livekit/meet/solo-participant
 * Solo a participant (mute all others) or clear solo. Super admin only.
 * Body: { roomName: string; participantIdentity: string } - to solo
 * Body: { roomName: string; clear: true } - to clear solo (unmute all)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden: super admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { roomName, participantIdentity, clear } = body;

    if (!roomName || typeof roomName !== 'string') {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    if (clear === true) {
      const result = await clearMeetSolo(roomName);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, cleared: true });
    }

    if (!participantIdentity) {
      return NextResponse.json({ error: 'participantIdentity is required when not clearing' }, { status: 400 });
    }

    const result = await soloMeetParticipant(roomName, participantIdentity);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Meet Solo] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';
import { banMeetParticipant } from '@/utils/livekit/meet-kick';

/**
 * POST /api/livekit/meet/ban-participant
 * Ban a participant from a meet room (kicks them and blocks rejoin). Super admin only.
 * Body: { roomName: string; participantIdentity: string; participantName?: string }
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
    const { roomName, participantIdentity, participantName } = body;

    if (!roomName || !participantIdentity) {
      return NextResponse.json(
        { error: 'roomName and participantIdentity are required' },
        { status: 400 }
      );
    }

    const result = await banMeetParticipant(
      roomName,
      participantIdentity,
      participantName || undefined
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Meet Ban] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

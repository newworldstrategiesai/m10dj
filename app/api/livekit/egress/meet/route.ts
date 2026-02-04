import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';
import { startMeetEgress } from '@/utils/livekit/egress';

/**
 * POST /api/livekit/egress/meet
 * Start recording a meet room. Super admin only.
 * Body: { roomName: string }
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
    const { roomName } = body;

    if (!roomName || typeof roomName !== 'string') {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    const result = await startMeetEgress(roomName);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ egressId: result.egressId });
  } catch (err) {
    console.error('[Egress Meet] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

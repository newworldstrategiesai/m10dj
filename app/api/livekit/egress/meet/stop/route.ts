import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';
import { stopMeetEgress } from '@/utils/livekit/egress';

/**
 * POST /api/livekit/egress/meet/stop
 * Stop an active meet recording. Super admin only.
 * Body: { egressId: string }
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
    const { egressId } = body;

    if (!egressId || typeof egressId !== 'string') {
      return NextResponse.json({ error: 'egressId is required' }, { status: 400 });
    }

    const result = await stopMeetEgress(egressId);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Egress Meet Stop] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

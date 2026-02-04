import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';

/**
 * GET /api/livekit/meet/banned?roomName=meet-xxx
 * Get banned identities and names for a meet room. Super admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden: super admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName');

    if (!roomName || !roomName.startsWith('meet-')) {
      return NextResponse.json({ error: 'roomName is required and must be a meet room' }, { status: 400 });
    }

    const { data: room, error } = await supabase
      .from('meet_rooms')
      .select('banned_identities, banned_names')
      .eq('room_name', roomName)
      .single();

    if (error || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const r = room as { banned_identities?: string[] | null; banned_names?: string[] | null };
    const bannedIdentities = r.banned_identities ?? [];
    const bannedNames = r.banned_names ?? [];

    return NextResponse.json({
      bannedIdentities,
      bannedNames,
    });
  } catch (err) {
    console.error('[Meet Banned] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

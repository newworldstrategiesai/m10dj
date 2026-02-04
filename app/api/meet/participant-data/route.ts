import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';

/**
 * GET /api/meet/participant-data?roomName=meet-xxx&participantIdentity=email-abc
 * Returns stored participant data (email, display name, joined_at) for a participant.
 * Only room owner or super admin. Used when host clicks a participant tile to view details.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName');
    const participantIdentity = searchParams.get('participantIdentity');

    if (!roomName || !roomName.startsWith('meet-')) {
      return NextResponse.json({ error: 'roomName is required and must be a meet room' }, { status: 400 });
    }
    if (!participantIdentity) {
      return NextResponse.json({ error: 'participantIdentity is required' }, { status: 400 });
    }

    const { data: room } = await supabase
      .from('meet_rooms')
      .select('user_id')
      .eq('room_name', roomName)
      .single();

    const roomData = room as { user_id?: string } | null;
    const isOwner = roomData?.user_id === user.id;
    const isAdmin = isSuperAdminEmail(user.email);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: participant, error: fetchError } = await supabase
      .from('meet_room_participants')
      .select('email, display_name, joined_at, updated_at')
      .eq('room_name', roomName)
      .eq('participant_identity', participantIdentity)
      .maybeSingle();

    if (fetchError) {
      console.error('[Meet participant-data] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to load participant' }, { status: 500 });
    }

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    return NextResponse.json({
      email: (participant as { email?: string }).email,
      displayName: (participant as { display_name?: string }).display_name,
      joinedAt: (participant as { joined_at?: string }).joined_at,
      updatedAt: (participant as { updated_at?: string }).updated_at,
    });
  } catch (err) {
    console.error('[Meet participant-data] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

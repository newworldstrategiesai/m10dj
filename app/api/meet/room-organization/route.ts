import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/meet/room-organization?roomName=meet-xxx
 * Returns the host's organization for a meet room when request_a_song_enabled.
 * Public (no auth) - used by guests on the public meet page to load the requests form.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName');

    if (!roomName || !roomName.startsWith('meet-')) {
      return NextResponse.json({ error: 'roomName required and must be a meet room' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: room, error: roomError } = await supabase
      .from('meet_rooms')
      .select('user_id, request_a_song_enabled')
      .eq('room_name', roomName)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const typedRoom = room as { user_id: string; request_a_song_enabled?: boolean };
    if (!typedRoom.request_a_song_enabled) {
      return NextResponse.json({ error: 'Request a song not enabled for this room' }, { status: 404 });
    }

    // Resolve organization: owner first, then first membership
    let { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', typedRoom.user_id)
      .limit(1)
      .maybeSingle();

    if (!org) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', typedRoom.user_id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (membership) {
        const { data: orgByMember } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', (membership as { organization_id: string }).organization_id)
          .single();
        org = orgByMember;
      }
    }

    if (!org) {
      return NextResponse.json({ error: 'No organization for host' }, { status: 404 });
    }

    return NextResponse.json({ organization: org });
  } catch (err) {
    console.error('[Meet room-organization] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

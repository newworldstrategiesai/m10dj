import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';
import { RoomServiceClient } from 'livekit-server-sdk';

/**
 * GET /api/livekit/meet/participants?roomName=meet-xxx
 * List participants in a meet room. Super admin or room owner.
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

    if (!roomName || !roomName.startsWith('meet-')) {
      return NextResponse.json({ error: 'roomName is required and must be a meet room' }, { status: 400 });
    }

    // Check room ownership or super admin
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

    const host = process.env.LIVEKIT_URL?.replace('wss://', 'https://').replace('ws://', 'http://');
    if (!host || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return NextResponse.json({ error: 'LiveKit not configured' }, { status: 500 });
    }

    const client = new RoomServiceClient(host, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);

    const participants = await client.listParticipants(roomName);

    const list = participants.map((p) => ({
      identity: p.identity,
      name: (p as { name?: string }).name ?? p.identity,
    }));

    return NextResponse.json({ participants: list });
  } catch (err) {
    console.error('[Meet Participants] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

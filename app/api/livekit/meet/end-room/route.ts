import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { endMeetRoom } from '@/utils/livekit/meet-kick';

/**
 * POST /api/livekit/meet/end-room
 * End a meeting (delete LiveKit room, disconnects all). Room owner only.
 * Body: { roomName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomName } = body;

    if (!roomName || !roomName.startsWith('meet-')) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    const { data: room } = await supabase
      .from('meet_rooms')
      .select('user_id')
      .eq('room_name', roomName)
      .single();

    const roomData = room as { user_id?: string } | null;
    if (!roomData || roomData.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: not room owner' }, { status: 403 });
    }

    const result = await endMeetRoom(roomName);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Meet End Room] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

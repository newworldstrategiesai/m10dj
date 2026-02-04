import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/meet/participant-register
 * Body: { roomName: string; participantIdentity: string; participantName: string; email: string }
 * Called by the meet page after a participant joins (pre-join submit). Stores email/display name
 * for host-only lookup. No auth required (participant self-registers); room must exist and be active.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, participantIdentity, participantName, email } = body;

    if (!roomName || typeof roomName !== 'string' || !roomName.startsWith('meet-')) {
      return NextResponse.json({ error: 'roomName is required and must be a meet room' }, { status: 400 });
    }
    if (!participantIdentity || typeof participantIdentity !== 'string') {
      return NextResponse.json({ error: 'participantIdentity is required' }, { status: 400 });
    }
    const displayName = typeof participantName === 'string' ? participantName.trim() || 'Guest' : 'Guest';
    const emailTrimmed = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: room, error: roomError } = await supabase
      .from('meet_rooms')
      .select('id, is_active')
      .eq('room_name', roomName)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    if (!(room as { is_active?: boolean }).is_active) {
      return NextResponse.json({ error: 'Meeting is not active' }, { status: 404 });
    }

    const { error: upsertError } = await supabase
      .from('meet_room_participants')
      .upsert(
        {
          room_name: roomName,
          participant_identity: participantIdentity,
          email: emailTrimmed,
          display_name: displayName,
          updated_at: new Date().toISOString(),
          // joined_at left unset so DB default (NOW()) applies on insert only
        },
        { onConflict: 'room_name,participant_identity' }
      );

    if (upsertError) {
      console.error('[Meet participant-register] Upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to save participant' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Meet participant-register] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/meet/polls/vote
 * Record or update a participant's vote. No auth required (participants may be guests).
 * Uses service role to bypass RLS.
 * Body: { roomName: string, clientPollId: string, optionIndex: number, participantIdentity: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await request.json();
    const { roomName, clientPollId, optionIndex, participantIdentity } = body;

    if (!roomName || typeof roomName !== 'string' || !roomName.startsWith('meet-')) {
      return NextResponse.json({ error: 'roomName required and must be a meet room' }, { status: 400 });
    }
    if (!clientPollId || typeof clientPollId !== 'string' || !clientPollId.trim()) {
      return NextResponse.json({ error: 'clientPollId required' }, { status: 400 });
    }
    if (typeof optionIndex !== 'number' || !Number.isInteger(optionIndex) || optionIndex < 0) {
      return NextResponse.json({ error: 'optionIndex must be a non-negative integer' }, { status: 400 });
    }
    if (!participantIdentity || typeof participantIdentity !== 'string' || !participantIdentity.trim()) {
      return NextResponse.json({ error: 'participantIdentity required' }, { status: 400 });
    }

    const { data: room, error: roomError } = await supabase
      .from('meet_rooms')
      .select('id')
      .eq('room_name', roomName)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const { data: poll, error: pollError } = await supabase
      .from('meet_polls')
      .select('id, options')
      .eq('meet_room_id', (room as { id: string }).id)
      .eq('client_poll_id', clientPollId.trim())
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const typedPoll = poll as { id: string; options: string[] };
    const opts = Array.isArray(typedPoll.options) ? typedPoll.options : [];
    const maxIndex = Math.max(0, opts.length - 1);
    const safeOptionIndex = Math.min(maxIndex, Math.max(0, optionIndex));

    const { error: upsertError } = await supabase.from('meet_poll_votes').upsert(
      {
        poll_id: typedPoll.id,
        participant_identity: participantIdentity.trim(),
        option_index: safeOptionIndex,
      },
      {
        onConflict: 'poll_id,participant_identity',
        ignoreDuplicates: false,
      }
    );

    if (upsertError) {
      console.error('[Meet polls vote]', upsertError);
      return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Meet polls vote]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

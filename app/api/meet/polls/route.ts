import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/meet/polls?roomName=meet-xxx
 * List polls for a meet room. Caller must be the room owner.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName');

    if (!roomName || !roomName.startsWith('meet-')) {
      return NextResponse.json({ error: 'roomName required and must be a meet room' }, { status: 400 });
    }

    const { data: room, error: roomError } = await supabase
      .from('meet_rooms')
      .select('id, user_id')
      .eq('room_name', roomName)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const typedRoom = room as { id: string; user_id: string };
    if (typedRoom.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: only room owner can list polls' }, { status: 403 });
    }

    const { data: polls, error: pollsError } = await supabase
      .from('meet_polls')
      .select('id, client_poll_id, question, options, created_at')
      .eq('meet_room_id', typedRoom.id)
      .order('created_at', { ascending: false });

    if (pollsError) {
      console.error('[Meet polls list]', pollsError);
      return NextResponse.json({ error: 'Failed to list polls' }, { status: 500 });
    }

    const pollIds = (polls ?? []).map((p) => (p as { id: string }).id);
    if (pollIds.length === 0) {
      return NextResponse.json({ polls: [], votesByPoll: {} });
    }

    const { data: votes, error: votesError } = await supabase
      .from('meet_poll_votes')
      .select('poll_id, option_index, participant_identity')
      .in('poll_id', pollIds);

    if (votesError) {
      console.error('[Meet polls list votes]', votesError);
      return NextResponse.json({ polls: polls ?? [], votesByPoll: {} });
    }

    const votesByPoll: Record<string, { optionIndex: number; participantIdentity: string }[]> = {};
    for (const p of pollIds) votesByPoll[p] = [];
    for (const v of votes ?? []) {
      const row = v as { poll_id: string; option_index: number; participant_identity: string };
      if (!votesByPoll[row.poll_id]) votesByPoll[row.poll_id] = [];
      votesByPoll[row.poll_id].push({
        optionIndex: row.option_index,
        participantIdentity: row.participant_identity,
      });
    }

    return NextResponse.json({ polls: polls ?? [], votesByPoll });
  } catch (err) {
    console.error('[Meet polls list]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meet/polls
 * Create a poll for a meet room. Caller must be the room owner (host).
 * Body: { roomName: string, question: string, options: string[], clientPollId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomName, question, options, clientPollId } = body;

    if (!roomName || typeof roomName !== 'string' || !roomName.startsWith('meet-')) {
      return NextResponse.json({ error: 'roomName required and must be a meet room' }, { status: 400 });
    }
    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'question required' }, { status: 400 });
    }
    if (!Array.isArray(options) || options.length === 0) {
      return NextResponse.json({ error: 'options must be a non-empty array' }, { status: 400 });
    }
    if (!clientPollId || typeof clientPollId !== 'string' || !clientPollId.trim()) {
      return NextResponse.json({ error: 'clientPollId required' }, { status: 400 });
    }

    const opts = options
      .filter((o: unknown) => typeof o === 'string' && o.trim())
      .map((o: string) => o.trim())
      .slice(0, 6);

    if (opts.length === 0) {
      return NextResponse.json({ error: 'At least one non-empty option required' }, { status: 400 });
    }

    const { data: room, error: roomError } = await supabase
      .from('meet_rooms')
      .select('id, user_id')
      .eq('room_name', roomName)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const typedRoom = room as { id: string; user_id: string };
    if (typedRoom.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: only room owner can create polls' }, { status: 403 });
    }

    const { data: poll, error: insertError } = await (supabase.from('meet_polls') as any)
      .insert({
        meet_room_id: typedRoom.id,
        client_poll_id: clientPollId.trim(),
        question: question.trim(),
        options: opts,
      })
      .select('id')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Poll with this clientPollId already exists for this room' }, { status: 409 });
      }
      console.error('[Meet polls create]', insertError);
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }

    return NextResponse.json({ pollId: (poll as { id: string }).id });
  } catch (err) {
    console.error('[Meet polls create]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

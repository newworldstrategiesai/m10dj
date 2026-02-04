/**
 * Meet participant kick and ban - uses LiveKit RoomServiceClient + Supabase.
 * Kick: remove participant from the room.
 * Ban: add to room ban list (stored in meet_rooms) and remove from room.
 */

import { RoomServiceClient } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

function getRoomService(): RoomServiceClient | null {
  const host = process.env.LIVEKIT_URL?.replace('wss://', 'https://').replace('ws://', 'http://');
  if (!host || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) return null;
  return new RoomServiceClient(host, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Kick a participant from the room (removes them, does not ban).
 */
export async function kickMeetParticipant(
  roomName: string,
  participantIdentity: string
): Promise<{ ok: boolean; error?: string }> {
  if (!roomName.startsWith('meet-')) {
    return { ok: false, error: 'Invalid room' };
  }

  const client = getRoomService();
  if (!client) return { ok: false, error: 'LiveKit not configured' };

  try {
    await client.removeParticipant(roomName, participantIdentity);
    return { ok: true };
  } catch (err) {
    console.error('[MeetKick] kickMeetParticipant error:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to kick participant',
    };
  }
}

/**
 * Unban a participant: remove from banned_identities and/or banned_names.
 * Pass participantIdentity and/or participantName to unban.
 */
export async function unbanMeetParticipant(
  roomName: string,
  options: { participantIdentity?: string; participantName?: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!roomName.startsWith('meet-')) {
    return { ok: false, error: 'Invalid room' };
  }
  if (!options.participantIdentity && !options.participantName) {
    return { ok: false, error: 'participantIdentity or participantName required' };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: 'Database not configured' };

  try {
    const { data: room, error: fetchError } = await supabase
      .from('meet_rooms')
      .select('id, banned_identities, banned_names')
      .eq('room_name', roomName)
      .single();

    if (fetchError || !room) {
      return { ok: false, error: 'Room not found' };
    }

    let identities = (room.banned_identities ?? []) as string[];
    let names = (room.banned_names ?? []) as string[];

    if (options.participantIdentity) {
      identities = identities.filter((id) => id !== options.participantIdentity);
    }
    if (options.participantName && options.participantName.trim()) {
      const nameLower = options.participantName.trim().toLowerCase();
      names = names.filter((n) => n.toLowerCase() !== nameLower);
    }

    const { error: updateError } = await supabase
      .from('meet_rooms')
      .update({
        banned_identities: identities,
        banned_names: names,
        updated_at: new Date().toISOString(),
      })
      .eq('id', room.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }
    return { ok: true };
  } catch (err) {
    console.error('[MeetKick] unbanMeetParticipant error:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to unban participant',
    };
  }
}

/**
 * Delete a LiveKit room (disconnects all participants). Use when host ends meeting.
 */
export async function endMeetRoom(roomName: string): Promise<{ ok: boolean; error?: string }> {
  if (!roomName.startsWith('meet-')) {
    return { ok: false, error: 'Invalid room' };
  }

  const client = getRoomService();
  if (!client) return { ok: false, error: 'LiveKit not configured' };

  try {
    await client.deleteRoom(roomName);
    return { ok: true };
  } catch (err) {
    // Room may already be deleted (last participant left)
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('not found') || msg.includes('already')) {
      return { ok: true };
    }
    console.error('[MeetKick] endMeetRoom error:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to end meeting',
    };
  }
}

/**
 * Ban a participant: add to room ban list and kick them.
 * Uses participantName for banned_names (blocks anonymous rejoins with same display name).
 */
export async function banMeetParticipant(
  roomName: string,
  participantIdentity: string,
  participantName?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!roomName.startsWith('meet-')) {
    return { ok: false, error: 'Invalid room' };
  }

  const roomClient = getRoomService();
  const supabase = getSupabaseAdmin();
  if (!roomClient) return { ok: false, error: 'LiveKit not configured' };
  if (!supabase) return { ok: false, error: 'Database not configured' };

  try {
    // Add to ban list
    const { data: room, error: fetchError } = await supabase
      .from('meet_rooms')
      .select('id, banned_identities, banned_names')
      .eq('room_name', roomName)
      .single();

    if (fetchError || !room) {
      return { ok: false, error: 'Room not found' };
    }

    const identities = (room.banned_identities ?? []) as string[];
    const names = (room.banned_names ?? []) as string[];

    const newIdentities = identities.includes(participantIdentity)
      ? identities
      : [...identities, participantIdentity];

    let newNames = names;
    if (participantName && participantName.trim()) {
      const nameLower = participantName.trim().toLowerCase();
      if (!names.some((n) => n.toLowerCase() === nameLower)) {
        newNames = [...names, participantName.trim()];
      }
    }

    const { error: updateError } = await supabase
      .from('meet_rooms')
      .update({
        banned_identities: newIdentities,
        banned_names: newNames,
        updated_at: new Date().toISOString(),
      })
      .eq('id', room.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    // Kick from room
    await roomClient.removeParticipant(roomName, participantIdentity);
    return { ok: true };
  } catch (err) {
    console.error('[MeetKick] banMeetParticipant error:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to ban participant',
    };
  }
}

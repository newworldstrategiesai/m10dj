/**
 * Meet participant mute/solo - uses LiveKit RoomServiceClient.
 * Mute: mute a participant's microphone track.
 * Solo: mute all participants except the specified one (only their audio broadcasts).
 */

import { RoomServiceClient, TrackSource } from 'livekit-server-sdk';
import type { ParticipantInfo, TrackInfo } from 'livekit-server-sdk';

function getRoomService(): RoomServiceClient | null {
  const host = process.env.LIVEKIT_URL?.replace('wss://', 'https://').replace('ws://', 'http://');
  if (!host || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) return null;
  return new RoomServiceClient(host, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
}

function getMicTrackSids(participant: ParticipantInfo): string[] {
  const tracks = participant.tracks ?? [];
  return tracks
    .filter((t) => (t.source ?? 0) === TrackSource.MICROPHONE)
    .map((t) => t.sid)
    .filter((sid): sid is string => !!sid);
}

/**
 * Mute or unmute a participant's microphone in a meet room.
 */
export async function muteMeetParticipant(
  roomName: string,
  participantIdentity: string,
  muted: boolean
): Promise<{ ok: boolean; error?: string }> {
  if (!roomName.startsWith('meet-')) {
    return { ok: false, error: 'Invalid room' };
  }

  const client = getRoomService();
  if (!client) return { ok: false, error: 'LiveKit not configured' };

  try {
    const participant = await client.getParticipant(roomName, participantIdentity);
    const micSids = getMicTrackSids(participant);
    if (micSids.length === 0) {
      return { ok: true }; // No mic track to mute
    }
    for (const trackSid of micSids) {
      await client.mutePublishedTrack(roomName, participantIdentity, trackSid, muted);
    }
    return { ok: true };
  } catch (err) {
    console.error('[MeetMute] muteMeetParticipant error:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to mute participant',
    };
  }
}

/**
 * Solo a participant: mute all others' microphones so only this participant's audio broadcasts.
 */
export async function soloMeetParticipant(
  roomName: string,
  soloIdentity: string
): Promise<{ ok: boolean; error?: string }> {
  if (!roomName.startsWith('meet-')) {
    return { ok: false, error: 'Invalid room' };
  }

  const client = getRoomService();
  if (!client) return { ok: false, error: 'LiveKit not configured' };

  try {
    const participants = await client.listParticipants(roomName);
    for (const p of participants) {
      const identity = p.identity ?? '';
      if (identity === soloIdentity) continue; // Skip the solo participant
      const micSids = getMicTrackSids(p);
      for (const trackSid of micSids) {
        await client.mutePublishedTrack(roomName, identity, trackSid, true);
      }
    }
    return { ok: true };
  } catch (err) {
    console.error('[MeetMute] soloMeetParticipant error:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to solo participant',
    };
  }
}

/**
 * Clear solo: unmute all participants.
 */
export async function clearMeetSolo(roomName: string): Promise<{ ok: boolean; error?: string }> {
  if (!roomName.startsWith('meet-')) {
    return { ok: false, error: 'Invalid room' };
  }

  const client = getRoomService();
  if (!client) return { ok: false, error: 'LiveKit not configured' };

  try {
    const participants = await client.listParticipants(roomName);
    for (const p of participants) {
      const identity = p.identity ?? '';
      const micSids = getMicTrackSids(p);
      for (const trackSid of micSids) {
        await client.mutePublishedTrack(roomName, identity, trackSid, false);
      }
    }
    return { ok: true };
  } catch (err) {
    console.error('[MeetMute] clearMeetSolo error:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to clear solo',
    };
  }
}

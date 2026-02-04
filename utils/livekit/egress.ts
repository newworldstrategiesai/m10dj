/**
 * Optional LiveKit Egress for voice call and meet recording.
 * When LIVEKIT_EGRESS_ENABLED and S3 (or storage) env are set:
 * - Voice calls: room composite egress (audio-only) for outbound-* / inbound-*
 * - Meet rooms: room composite egress (video+audio) for meet-*
 * egress_ended webhook updates voice_calls or meet_rooms.recording_url.
 */

import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
} from 'livekit-server-sdk';

function getEgressClient(): EgressClient | null {
  const host = process.env.LIVEKIT_URL?.replace('wss://', 'https://').replace('ws://', 'http://');
  if (!host || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) return null;
  return new EgressClient(host, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
}

function getS3Output(): EncodedFileOutput | null {
  const bucket = process.env.LIVEKIT_EGRESS_S3_BUCKET;
  const region = process.env.LIVEKIT_EGRESS_S3_REGION || 'us-east-1';
  const accessKey = process.env.LIVEKIT_EGRESS_S3_ACCESS_KEY;
  const secret = process.env.LIVEKIT_EGRESS_S3_SECRET_KEY;
  const keyPrefix = process.env.LIVEKIT_EGRESS_S3_KEY_PREFIX || 'voice-calls';

  if (!bucket || !accessKey || !secret) return null;

  const filepath = `${keyPrefix}/{room_name}-{time}`;
  const endpoint = process.env.LIVEKIT_EGRESS_S3_ENDPOINT || '';
  const s3 = new S3Upload({
    accessKey,
    secret,
    region,
    bucket,
    endpoint,
    forcePathStyle: !!endpoint,
  });

  return new EncodedFileOutput({
    fileType: EncodedFileType.MP3,
    filepath,
    output: { case: 's3', value: s3 },
  });
}

/**
 * Start room composite egress (audio-only) for a call room when Egress is configured.
 * Call from outbound-call (after room create) and handleInboundSipCall (after insert).
 * egress_ended webhook will update voice_calls.recording_url by room_name.
 */
export async function startCallEgress(roomName: string): Promise<{ egressId: string } | null> {
  if (!process.env.LIVEKIT_EGRESS_ENABLED || process.env.LIVEKIT_EGRESS_ENABLED !== 'true') {
    return null;
  }
  const isCallRoom = roomName.startsWith('outbound-') || roomName.startsWith('inbound-');
  if (!isCallRoom) return null;

  const client = getEgressClient();
  const output = getS3Output();
  if (!client || !output) return null;

  try {
    const info = await client.startRoomCompositeEgress(roomName, output, {
      audioOnly: true,
    });
    return info?.egressId ? { egressId: info.egressId } : null;
  } catch (err) {
    console.error('[Egress] startCallEgress error:', err);
    return null;
  }
}

function getMeetS3Output(audioOnly: boolean): EncodedFileOutput | null {
  const bucket = process.env.LIVEKIT_EGRESS_S3_BUCKET;
  const region = process.env.LIVEKIT_EGRESS_S3_REGION || 'us-east-1';
  const accessKey = process.env.LIVEKIT_EGRESS_S3_ACCESS_KEY;
  const secret = process.env.LIVEKIT_EGRESS_S3_SECRET_KEY;
  const keyPrefix = process.env.LIVEKIT_EGRESS_S3_MEET_PREFIX || 'meet-recordings';

  if (!bucket || !accessKey || !secret) return null;

  const filepath = `${keyPrefix}/{room_name}-{time}`;
  const endpoint = process.env.LIVEKIT_EGRESS_S3_ENDPOINT || '';
  const s3 = new S3Upload({
    accessKey,
    secret,
    region,
    bucket,
    endpoint,
    forcePathStyle: !!endpoint,
  });

  return new EncodedFileOutput({
    fileType: audioOnly ? EncodedFileType.MP3 : EncodedFileType.MP4,
    filepath,
    output: { case: 's3', value: s3 },
  });
}

/**
 * Start room composite egress for a meet room (video+audio or audio-only).
 * Super admin only. egress_ended webhook updates meet_rooms.recording_url.
 */
export async function startMeetEgress(
  roomName: string,
  options?: { audioOnly?: boolean }
): Promise<{ egressId: string } | { error: string }> {
  if (!process.env.LIVEKIT_EGRESS_ENABLED || process.env.LIVEKIT_EGRESS_ENABLED !== 'true') {
    return { error: 'Egress is not enabled. Set LIVEKIT_EGRESS_ENABLED=true and S3 env vars.' };
  }
  const isMeetRoom = roomName.startsWith('meet-');
  if (!isMeetRoom) return { error: 'Invalid room: must be a meet room (meet-*)' };

  const audioOnly = options?.audioOnly ?? false;
  const client = getEgressClient();
  const output = getMeetS3Output(audioOnly);
  if (!client) return { error: 'LiveKit API not configured' };
  if (!output) return { error: 'S3 storage not configured for meet recordings' };

  try {
    const info = await client.startRoomCompositeEgress(roomName, output, {
      audioOnly,
    });
    return info?.egressId ? { egressId: info.egressId } : { error: 'Failed to start egress' };
  } catch (err) {
    console.error('[Egress] startMeetEgress error:', err);
    return { error: err instanceof Error ? err.message : 'Failed to start recording' };
  }
}

/**
 * Stop an active meet egress.
 */
export async function stopMeetEgress(egressId: string): Promise<{ ok: boolean; error?: string }> {
  const client = getEgressClient();
  if (!client) return { ok: false, error: 'LiveKit API not configured' };

  try {
    await client.stopEgress(egressId);
    return { ok: true };
  } catch (err) {
    console.error('[Egress] stopMeetEgress error:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to stop recording' };
  }
}

/**
 * Optional LiveKit Egress for voice call recording (Phase 4).
 * When LIVEKIT_EGRESS_ENABLED and S3 (or storage) env are set, starts room composite
 * egress (audio-only) for outbound-* / inbound-* rooms. egress_ended webhook then
 * updates voice_calls.recording_url.
 */

import { EgressClient, EncodedFileOutput, EncodedFileType, S3Upload } from 'livekit-server-sdk';

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
  const s3 = new S3Upload({
    accessKey,
    secret,
    region,
    bucket,
    endpoint: process.env.LIVEKIT_EGRESS_S3_ENDPOINT || '',
    forcePathStyle: false,
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

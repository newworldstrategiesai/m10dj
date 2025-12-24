import { AccessToken } from 'livekit-server-sdk';

/**
 * Generate LiveKit tokens for voice calls
 */

export async function generateCallToken(
  roomName: string,
  role: 'admin' | 'client',
  identity: string
): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit not configured');
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name: role === 'admin' ? 'Admin' : 'Client',
    ttl: '1h',
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomCreate: role === 'admin',
  });

  return await at.toJwt();
}


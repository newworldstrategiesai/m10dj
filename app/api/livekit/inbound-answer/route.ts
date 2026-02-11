import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/livekit/inbound-answer
 * Returns a LiveKit token for the current admin to join an inbound call room.
 * Body: { roomName: string }
 * Response: { token, serverUrl }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const roomName = body?.roomName;

    if (!roomName || typeof roomName !== 'string') {
      return NextResponse.json(
        { error: 'roomName is required' },
        { status: 400 }
      );
    }

    // Only allow joining inbound-* or sip-* rooms (SIP inbound convention)
    if (!roomName.startsWith('inbound-') && !roomName.startsWith('sip-')) {
      return NextResponse.json(
        { error: 'Invalid room for inbound answer' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return NextResponse.json(
        { error: 'LiveKit not configured' },
        { status: 500 }
      );
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: `admin-${user.id}`,
      name: user.email ?? 'Admin',
      ttl: '1h',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      serverUrl,
    });
  } catch (error) {
    console.error('Error generating inbound-answer token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

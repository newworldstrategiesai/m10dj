import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from './rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const rateLimit = checkRateLimit(ip);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          resetAt: rateLimit.resetAt 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const body = await request.json();
    const { roomName, participantName, participantIdentity, roomType } = body;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle admin-assistant room type (no roomName required, auto-generated)
    if (roomType === 'admin-assistant') {
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;

      if (!apiKey || !apiSecret) {
        return NextResponse.json(
          { error: 'LiveKit not configured' },
          { status: 500 }
        );
      }

      // Generate room name if not provided
      const assistantRoomName = roomName || `assistant-${user.id}`;

      // Set token expiry to 30 minutes for assistant rooms
      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantIdentity || user.id,
        name: participantName || user.email || 'Admin',
        ttl: '30m', // 30-minute expiry for assistant rooms
      });

      // Grant permissions for audio publishing/subscribing
      at.addGrant({
        room: assistantRoomName,
        roomJoin: true,
        canPublish: true,  // Audio only
        canSubscribe: true,
        canPublishData: true,
        roomCreate: true, // Allow creating the room if it doesn't exist
      });

      const token = await at.toJwt();

      return NextResponse.json({
        token,
        url: process.env.LIVEKIT_URL,
        roomName: assistantRoomName,
      }, {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        }
      });
    }

    // Original logic for live stream rooms
    if (!roomName) {
      return NextResponse.json(
        { error: 'roomName is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this room (check if they own it or it's public)
    const { data: stream } = await supabase
      .from('live_streams')
      .select('id, user_id, is_live, ppv_price_cents')
      .eq('room_name', roomName)
      .single();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    const typedStream = stream as { id: string; user_id: string; is_live: boolean; ppv_price_cents: number | null };

    // Check PPV access
    const isOwner = typedStream.user_id === user.id;
    const isPublic = typedStream.is_live && (!typedStream.ppv_price_cents || typedStream.ppv_price_cents === 0);
    const ppvToken = body.ppvToken;

    if (!isOwner && !isPublic) {
      // Check if user has valid PPV token
      if (!ppvToken) {
        return NextResponse.json(
          { error: 'Payment required' },
          { status: 402 }
        );
      }

      const { data: tokenData } = await supabase
        .from('ppv_tokens')
        .select('*')
        .eq('token', ppvToken)
        .eq('stream_id', typedStream.id)
        .eq('used', false)
        .single();

      if (!tokenData) {
        return NextResponse.json(
          { error: 'Invalid or expired access token' },
          { status: 403 }
        );
      }
    }

    // Generate LiveKit token
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit not configured' },
        { status: 500 }
      );
    }

    // Set token expiry to 2 hours
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity || user.id,
      name: participantName || user.email || 'Anonymous',
      ttl: '2h', // 2-hour expiry for security
    });

    // Grant permissions based on role
    if (isOwner) {
      // Streamer can publish video/audio
      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });
    } else {
      // Viewer can only subscribe
      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: false,
        canSubscribe: true,
        canPublishData: true, // For chat
      });
    }

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      url: process.env.LIVEKIT_URL,
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetAt.toString(),
      }
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


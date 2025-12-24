import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { checkRateLimit } from '../token/rate-limit';

/**
 * Public Token Endpoint for Website Voice Assistant
 * 
 * Allows anonymous users to get LiveKit tokens for voice interactions
 * Session ID is used to track conversations
 */
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
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const body = await request.json();
    const { sessionId, participantName } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit not configured' },
        { status: 500 }
      );
    }

    // Generate room name from session ID
    const roomName = `public-voice-${sessionId}`;

    // Set token expiry to 1 hour for public sessions
    const at = new AccessToken(apiKey, apiSecret, {
      identity: `public-${sessionId}`,
      name: participantName || 'Guest',
      ttl: '1h', // 1-hour expiry for public sessions
    });

    // Grant permissions for audio publishing/subscribing
    at.addGrant({
      room: roomName,
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
      roomName,
      sessionId,
    }, {
      headers: {
        'X-RateLimit-Limit': '20',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetAt.toString(),
      }
    });
  } catch (error) {
    console.error('Error generating public LiveKit token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from './rate-limit';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

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

    // Get authenticated user (may be null for anonymous viewers)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Note: We allow authError or no user for public streams (require_auth = false)

    // Handle admin-assistant room type (no roomName required, auto-generated)
    if (roomType === 'admin-assistant') {
      // Admin assistant requires authentication
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
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

    // Handle meet-preview: subscribe-only token to show current broadcast before joining
    if (roomType === 'meet-preview') {
      if (!roomName) {
        return NextResponse.json(
          { error: 'roomName is required for meet-preview' },
          { status: 400 }
        );
      }

      const { data: meetRoom, error: meetError } = await supabase
        .from('meet_rooms')
        .select('id, is_active')
        .eq('room_name', roomName)
        .single();

      if (meetError || !meetRoom) {
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        );
      }

      const typedMeet = meetRoom as { id: string; is_active: boolean };
      if (!typedMeet.is_active) {
        return NextResponse.json(
          { error: 'Meeting is not active' },
          { status: 404 }
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

      const previewId = `preview-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const at = new AccessToken(apiKey, apiSecret, {
        identity: previewId,
        name: 'Preview',
        ttl: '5m',
      });

      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: false,   // Subscribe only - see the broadcast, don't appear
        canSubscribe: true,
        canPublishData: false,
        roomCreate: false,
      });

      const token = await at.toJwt();

      return NextResponse.json({
        token,
        url: process.env.LIVEKIT_URL,
        roomName,
      }, {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        }
      });
    }

    // Handle meet room type (TipJar video conferencing - everyone can publish)
    if (roomType === 'meet') {
      if (!roomName) {
        return NextResponse.json(
          { error: 'roomName is required for meet' },
          { status: 400 }
        );
      }

      const { data: meetRoom, error: meetError } = await supabase
        .from('meet_rooms')
        .select('id, user_id, username, is_active')
        .eq('room_name', roomName)
        .single();

      if (meetError || !meetRoom) {
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        );
      }

      const typedMeet = meetRoom as { id: string; user_id: string; username: string; is_active: boolean };

      if (!typedMeet.is_active) {
        return NextResponse.json(
          { error: 'Meeting is not active' },
          { status: 404 }
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

      // Meet supports anonymous users via PreJoin (username entry)
      // Logged-in users use their identity; anonymous use participantName + generated identity
      const participantDisplayName = participantName || user?.email?.split('@')[0] || 'Guest';
      const participantId = participantIdentity || user?.id || `anon-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      if (!participantDisplayName || participantDisplayName.trim() === '') {
        return NextResponse.json(
          { error: 'Display name is required to join the meeting' },
          { status: 400 }
        );
      }

      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantId,
        name: participantDisplayName,
        ttl: '2h',
      });

      // Meet: everyone can publish (video conferencing - full premade UI)
      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        roomCreate: false,
      });

      const token = await at.toJwt();

      return NextResponse.json({
        token,
        url: process.env.LIVEKIT_URL,
        roomName,
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
    // We need to get the stream owner's email to check if they're an admin
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('id, user_id, is_live, ppv_price_cents, require_auth')
      .eq('room_name', roomName)
      .single();

    if (streamError || !stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    const typedStream = stream as { 
      id: string; 
      user_id: string; 
      is_live: boolean; 
      ppv_price_cents: number | null;
      require_auth: boolean | null;
    };

    // Get stream owner's email to check if they're an admin
    let streamOwnerEmail: string | null = null;
    let isStreamOwnerAdmin = false;
    
    if (typedStream.user_id) {
      // Use service role to get user email (for admin check)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const { createClient: createServiceClient } = await import('@supabase/supabase-js');
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        );
        const { data: ownerData } = await serviceSupabase.auth.admin.getUserById(typedStream.user_id);
        if (ownerData?.user?.email) {
          streamOwnerEmail = ownerData.user.email;
          isStreamOwnerAdmin = isPlatformAdmin(streamOwnerEmail);
        }
      }
    }

    // Check if authentication is required
    const requireAuth = typedStream.require_auth === true;
    const isOwner = user && typedStream.user_id === user.id;
    
    // Allow anonymous access if:
    // 1. Stream doesn't require auth (require_auth = false), OR
    // 2. Stream owner is an admin (admins can broadcast public links)
    const allowsAnonymousAccess = !requireAuth || isStreamOwnerAdmin;
    
    // If stream requires auth and user is not logged in, deny access
    if (requireAuth && !user && !isStreamOwnerAdmin) {
      return NextResponse.json(
        { error: 'This stream requires you to be logged in' },
        { status: 401 }
      );
    }

    // Check PPV access
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
    // For anonymous users, generate a unique identity
    const participantId = participantIdentity || user?.id || `anon-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const participantDisplayName = participantName || user?.email?.split('@')[0] || 'Anonymous';
    
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantId,
      name: participantDisplayName,
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


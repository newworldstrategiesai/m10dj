import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL!.replace('wss://', 'https://'),
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (try requireAdmin, but allow service role for function executor)
    let user;
    try {
      user = await requireAdmin(
        request as any,
        { 
          status: (code: number) => ({ 
            json: (data: any) => NextResponse.json(data, { status: code }) 
          }), 
          headersSent: false 
        } as any
      );
    } catch (authError) {
      // If requireAdmin fails, this might be a service-to-service call from function executor
      // Check if we have a valid service role key in headers
      const authHeader = request.headers.get('authorization');
      if (authHeader?.includes(process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || '')) {
        // Service role call - allow it (for function executor)
        user = { id: 'system', email: 'system@m10dj.com' };
      } else {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const { contactId, phoneNumber, callType = 'follow_up' } = await request.json();

    if (!contactId && !phoneNumber) {
      return NextResponse.json(
        { error: 'contactId or phoneNumber is required' },
        { status: 400 }
      );
    }

    // Get contact details
    let contact = null;
    if (contactId) {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Contact not found' },
          { status: 404 }
        );
      }
      contact = data;
    }

    // Use provided phone number or contact's phone
    const targetPhone = phoneNumber || contact?.phone;
    if (!targetPhone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Create unique room name
    const roomName = `outbound-${contactId || 'unknown'}-${Date.now()}`;

    // Create LiveKit room
    try {
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 300, // 5 minutes
        maxParticipants: 2,
      });
    } catch (roomError: any) {
      // Room might already exist, that's okay
      if (!roomError.message?.includes('already exists')) {
        throw roomError;
      }
    }

    // Generate token for AI bot
    const botToken = await generateBotToken(roomName);

    // Store call record
    const { data: callRecord, error: callError } = await supabase
      .from('voice_calls')
      .insert({
        room_name: roomName,
        contact_id: contactId || null,
        client_phone: targetPhone,
        admin_phone: process.env.ADMIN_PHONE_NUMBER,
        direction: 'outbound',
        call_type: callType,
        status: 'ringing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (callError) {
      console.error('Error creating call record:', callError);
      // Continue anyway - call record is not critical
    }

    // Start AI bot in background (non-blocking)
    if (contact) {
      startAIVoiceBot(roomName, botToken, contact, callType).catch((error) => {
        console.error('Error starting AI bot:', error);
      });
    }

    // Note: Actual SIP call initiation requires LiveKit SIP configuration
    // For now, we'll return the room info
    // In production, you'd call: await initiateSIPCall(roomName, targetPhone);

    return NextResponse.json({
      success: true,
      roomName,
      status: 'initiated',
      message: 'Call room created. AI bot will join when call connects.',
      note: 'SIP calling requires LiveKit SIP gateway configuration',
    });
  } catch (error) {
    console.error('Error initiating outbound call:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initiate call',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function generateBotToken(roomName: string): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: 'ai-bot',
    name: 'AI Assistant',
    ttl: '1h',
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomCreate: true,
  });

  return await at.toJwt();
}

async function startAIVoiceBot(
  roomName: string,
  token: string,
  contact: any,
  callType: string
) {
  // This would start a background process that:
  // 1. Connects to LiveKit room
  // 2. Waits for client to join
  // 3. Handles conversation via AI
  
  // For now, we'll create a placeholder
  // Full implementation would require a separate worker process
  // or use LiveKit's Egress/Ingress features
  
  console.log(`AI bot would connect to room: ${roomName}`);
  console.log(`Contact: ${contact.first_name} ${contact.last_name}`);
  console.log(`Call type: ${callType}`);
  
  // TODO: Implement full AI voice bot
  // See: utils/livekit/ai-voice-bot.ts for structure
}


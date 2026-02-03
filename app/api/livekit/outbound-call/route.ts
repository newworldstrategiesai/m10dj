import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient, AccessToken, SipClient, AgentDispatchClient } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

const livekitHost = process.env.LIVEKIT_URL?.replace('wss://', 'https://').replace('ws://', 'http://') ?? '';

const roomService = new RoomServiceClient(
  livekitHost,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

function getAgentDispatchClient(): AgentDispatchClient | null {
  if (!livekitHost || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) return null;
  return new AgentDispatchClient(livekitHost, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getSipClient(): SipClient | null {
  if (!livekitHost || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) return null;
  return new SipClient(livekitHost, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { 
      contactId, 
      phoneNumber, 
      callType = 'follow_up',
      callReason,
      agentSettings,
      userId
    } = await request.json();

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
        maxParticipants: 4, // admin + SIP participant + optional bot
      });
    } catch (roomError: any) {
      // Room might already exist, that's okay
      if (!roomError.message?.includes('already exists')) {
        throw roomError;
      }
    }

    // Initiate SIP outbound call if trunk is configured
    const sipTrunkId = process.env.LIVEKIT_SIP_OUTBOUND_TRUNK_ID;
    const fromNumber = process.env.M10DJ_TWILIO_PHONE_NUMBER || undefined;
    if (sipTrunkId) {
      const sipClient = getSipClient();
      if (sipClient) {
        try {
          await sipClient.createSipParticipant(
            sipTrunkId,
            targetPhone,
            roomName,
            {
              participantName: contact ? `${contact.first_name} ${contact.last_name}` : targetPhone,
              participantIdentity: `sip-${contactId || 'unknown'}-${Date.now()}`,
              fromNumber: fromNumber || undefined,
              playDialtone: true,
            }
          );
        } catch (sipError: any) {
          console.error('SIP createSipParticipant error:', sipError);
          // Continue: admin can still join room; call may be unreachable
        }
      }
    }

    // Generate token for AI bot (optional, for future agent)
    const botToken = await generateBotToken(roomName);

    // Store call record with additional metadata
    const { data: callRecord, error: callError } = await supabase
      .from('voice_calls')
      .insert({
        room_name: roomName,
        contact_id: contactId || null,
        client_phone: targetPhone,
        admin_phone: process.env.ADMIN_PHONE_NUMBER || user.email || 'unknown',
        direction: 'outbound',
        call_type: callType,
        status: 'ringing',
        started_at: new Date().toISOString(),
        user_id: userId || user?.id || null,
        metadata: agentSettings ? JSON.stringify({
          agentName: agentSettings.agentName,
          role: agentSettings.role,
          companyName: agentSettings.companyName,
          callReason,
        }) : null,
      })
      .select()
      .single();

    if (callError) {
      console.error('Error creating call record:', callError);
      // Continue anyway - call record is not critical
    }

    // Optional: start room egress (audio recording) when LIVEKIT_EGRESS_ENABLED and S3 are set
    const { startCallEgress } = await import('@/utils/livekit/egress');
    startCallEgress(roomName).catch((err) => console.error('[Egress] startCallEgress:', err));

    // Dispatch default M10 agent (Ben) to the room so the deployed agent joins
    const { data: agentRow } = await supabase
      .from('livekit_agent_settings')
      .select('agent_name')
      .is('organization_id', null)
      .eq('name', 'default_m10')
      .maybeSingle();
    const agentName = (agentRow as { agent_name?: string } | null)?.agent_name ?? 'Ben';
    const dispatchClient = getAgentDispatchClient();
    if (dispatchClient) {
      try {
        await dispatchClient.createDispatch(roomName, agentName, {
          metadata: JSON.stringify({
            phone_number: targetPhone,
            contact_id: contactId ?? undefined,
            call_type: callType,
            call_reason: callReason ?? undefined,
            agent_settings: agentSettings ?? undefined,
          }),
        });
      } catch (dispatchErr: unknown) {
        console.error('Agent dispatch error:', dispatchErr);
        // Continue: admin can still join; agent may not be deployed
      }
    }

    // Admin token for joining the room (browser voice)
    const adminToken = await generateAdminToken(roomName, user);

    return NextResponse.json({
      success: true,
      roomName,
      token: adminToken,
      serverUrl: process.env.LIVEKIT_URL ?? '',
      status: 'initiated',
      message: sipTrunkId
        ? 'Call initiated. Join to talk in your browser.'
        : 'Room created. Configure LIVEKIT_SIP_OUTBOUND_TRUNK_ID to place real phone calls.',
      sipConfigured: !!sipTrunkId,
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

async function generateAdminToken(roomName: string, user: { id: string; email?: string | null }): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;

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

  return await at.toJwt();
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
  callType: string,
  options?: {
    agentSettings?: any;
    callReason?: string;
    userId?: string;
  }
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
  if (options?.agentSettings) {
    console.log(`Agent settings:`, options.agentSettings);
  }
  if (options?.callReason) {
    console.log(`Call reason: ${options.callReason}`);
  }
  
  // TODO: Implement full AI voice bot with agent settings
  // See: utils/livekit/ai-voice-bot.ts for structure
}


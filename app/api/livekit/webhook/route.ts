import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

// Webhook receiver for LiveKit events
// This can be used to track participant joins/leaves, room events, etc.

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const event = await receiver.receive(body, authHeader);

    // Handle different event types
    switch (event.event) {
      case 'room_started':
        // Update stream status to live
        if (event.room) {
          await updateStreamStatus(event.room.name, true);
        }
        break;

      case 'room_finished':
        // Update stream status to offline
        if (event.room) {
          await updateStreamStatus(event.room.name, false);
          // Voice call end: update voice_calls for outbound-* / inbound-* rooms
          if (event.room.name.startsWith('outbound-') || event.room.name.startsWith('inbound-')) {
            await handleCallEnd(event.room.name);
          }
        }
        break;

      case 'participant_joined':
        // Track participant join and broadcast viewer count
        if (event.room) {
          console.log(`Participant joined: ${event.participant?.identity} to room ${event.room.name}`);
          await broadcastViewerCount(event.room.name);
          // Inbound SIP call: room name prefix "inbound-" (LiveKit SIP dispatch rule convention)
          if (event.room.name.startsWith('inbound-') && event.participant) {
            await handleInboundSipCall(event.room.name, event.participant as { identity?: string; metadata?: string });
          }
        }
        break;

      case 'participant_left':
        // Track participant leave and broadcast viewer count
        if (event.room) {
          console.log(`Participant left: ${event.participant?.identity} from room ${event.room.name}`);
          await broadcastViewerCount(event.room.name);
          // Optional: when SIP participant leaves, we could mark call ended here,
          // but room_finished is the canonical signal when room is empty.
        }
        break;

      case 'egress_ended': {
        // Store recording URL in voice_calls when egress finishes (outbound-* / inbound-*)
        const raw = event as {
          egressInfo?: { roomName?: string; fileResults?: Array<{ location?: string }>; egressId?: string };
          egress_info?: { room_name?: string; file_results?: Array<{ location?: string }>; egress_id?: string };
        };
        const info = (raw.egressInfo ?? raw.egress_info) as Record<string, unknown> | undefined;
        const roomName = (info?.roomName ?? info?.room_name) as string | undefined;
        const fileResults = (info?.fileResults ?? info?.file_results) as Array<{ location?: string }> | undefined;
        const egressId = (info?.egressId ?? info?.egress_id) as string | undefined;
        if (roomName && (roomName.startsWith('outbound-') || roomName.startsWith('inbound-'))) {
          await handleEgressEnded({ roomName, egressId, fileResults });
        }
        break;
      }

      default:
        // Handle transcription events (not in WebhookEventNames type yet)
        const eventType = (event as any).event;
        if (eventType === 'transcription_received' || eventType === 'transcription_final') {
          const transcription = (event as any).transcription;
          if (transcription && event.room) {
            await handleCallTranscription(
              event.room.name,
              transcription.text || '',
              eventType === 'transcription_final'
            );
          }
        } else {
          console.log(`Unhandled LiveKit event: ${eventType || event.event}`);
        }
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing LiveKit webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateStreamStatus(roomName: string, isLive: boolean) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await (supabase
    .from('live_streams') as any)
    .update({ is_live: isLive, updated_at: new Date().toISOString() })
    .eq('room_name', roomName);
}

async function handleCallTranscription(
  roomName: string,
  text: string,
  isFinal: boolean
) {
  // Process SIP call rooms: outbound-*, inbound-*, and legacy call-*
  const isCallRoom =
    roomName.startsWith('outbound-') ||
    roomName.startsWith('inbound-') ||
    roomName.startsWith('call-');
  if (!isCallRoom) return;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get call record
    const { data: call, error: callError } = await supabase
      .from('voice_calls')
      .select('*')
      .eq('room_name', roomName)
      .single();

    if (callError || !call) {
      console.log(`Call record not found for room: ${roomName}`);
      return;
    }

    // Append to transcript
    const currentTranscript = call.transcript || '';
    const updatedTranscript = isFinal 
      ? currentTranscript + ' ' + text
      : currentTranscript; // Don't update partial transcripts in DB

    if (isFinal && text.trim()) {
      await supabase
        .from('voice_calls')
        .update({
          transcript: updatedTranscript.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('room_name', roomName);

      // If call is completed and we have a contact_id, analyze the transcript
      if (call.contact_id && call.status === 'completed') {
        const { analyzeCallTranscript } = await import('@/utils/admin-assistant/call-analyzer');
        await analyzeCallTranscript(
          call.contact_id,
          updatedTranscript.trim(),
          {
            duration: call.duration_seconds,
            callType: call.call_type,
            clientPhone: call.client_phone,
          }
        );
      }
    }
  } catch (error) {
    console.error('Error handling call transcription:', error);
  }
}

/** Handle inbound SIP call: create voice_calls row and notify admins to answer in browser */
async function handleInboundSipCall(
  roomName: string,
  participant: { identity?: string; metadata?: string }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existing } = await supabase
    .from('voice_calls')
    .select('id')
    .eq('room_name', roomName)
    .limit(1)
    .single();

  if (existing) return;

  let phoneNumber = participant.identity ?? roomName;
  if (participant.metadata) {
    try {
      const meta = JSON.parse(participant.metadata);
      if (meta.phoneNumber || meta.phone) phoneNumber = meta.phoneNumber || meta.phone;
    } catch {
      // ignore
    }
  }

  await supabase.from('voice_calls').insert({
    room_name: roomName,
    contact_id: null,
    client_phone: phoneNumber,
    admin_phone: null,
    direction: 'inbound',
    call_type: 'inbound',
    status: 'ringing',
    started_at: new Date().toISOString(),
  });

  // Optional: start room egress (audio recording) when LIVEKIT_EGRESS_ENABLED and S3 are set
  const { startCallEgress } = await import('@/utils/livekit/egress');
  startCallEgress(roomName).catch((err) => console.error('[Egress] startCallEgress:', err));

  const { broadcastToAllAdmins } = await import('@/utils/livekit/notifications');
  await broadcastToAllAdmins({
    type: 'incoming_call',
    title: 'Incoming call',
    message: `Call from ${phoneNumber}`,
    data: { roomName, phoneNumber, callerId: participant.identity },
    priority: 'high',
  });
}

/** Store recording URL in voice_calls when LiveKit egress ends (egress_ended webhook). */
async function handleEgressEnded(egressInfo: {
  roomName?: string;
  egressId?: string;
  fileResults?: Array<{ location?: string; filename?: string }>;
}) {
  const roomName = egressInfo.roomName;
  if (!roomName) return;

  const fileResults = egressInfo.fileResults ?? [];
  const firstFile = fileResults[0];
  const recordingUrl = firstFile?.location;
  if (!recordingUrl && !egressInfo.egressId) return;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const update: { recording_url?: string; egress_id?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (recordingUrl) update.recording_url = recordingUrl;
  if (egressInfo.egressId) update.egress_id = egressInfo.egressId;

  await supabase
    .from('voice_calls')
    .update(update)
    .eq('room_name', roomName);
}

/** Update voice_calls when a call room ends (room_finished for outbound-* / inbound-*). */
async function handleCallEnd(roomName: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: call, error: fetchError } = await supabase
    .from('voice_calls')
    .select('id, started_at, status')
    .eq('room_name', roomName)
    .maybeSingle();

  if (fetchError || !call) return;
  if (call.status === 'completed' || call.status === 'failed' || call.status === 'missed') return;

  const endedAt = new Date();
  const startedAt = call.started_at ? new Date(call.started_at) : endedAt;
  const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));

  await supabase
    .from('voice_calls')
    .update({
      status: 'completed',
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
      updated_at: endedAt.toISOString(),
    })
    .eq('room_name', roomName);
}

async function broadcastViewerCount(roomName: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get current participant count from LiveKit Room API
    const { RoomServiceClient } = await import('livekit-server-sdk');
    const roomService = new RoomServiceClient(
      process.env.LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );

    const participants = await roomService.listParticipants(roomName);
    // Filter out the streamer (participant with canPublish permission)
    const viewerCount = participants.filter(
      (p: any) => !p.permissions?.canPublish
    ).length;

    // Broadcast viewer count to all subscribers
    const channel = supabase.channel(`viewer_count:${roomName}`);
    await channel.send({
      type: 'broadcast',
      event: 'viewer_count_update',
      payload: { count: viewerCount, roomName },
    });
  } catch (error) {
    console.error('Error broadcasting viewer count:', error);
    // Fallback: try to get count from event data if available
    // Otherwise broadcast 0
    try {
      const channel = supabase.channel(`viewer_count:${roomName}`);
      await channel.send({
        type: 'broadcast',
        event: 'viewer_count_update',
        payload: { count: 0, roomName },
      });
    } catch (broadcastError) {
      console.error('Error broadcasting fallback count:', broadcastError);
    }
  }
}


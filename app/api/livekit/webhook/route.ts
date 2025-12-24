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
        }
        break;

      case 'participant_joined':
        // Track participant join and broadcast viewer count
        if (event.room) {
          console.log(`Participant joined: ${event.participant?.identity} to room ${event.room.name}`);
          await broadcastViewerCount(event.room.name);
        }
        break;

      case 'participant_left':
        // Track participant leave and broadcast viewer count
        if (event.room) {
          console.log(`Participant left: ${event.participant?.identity} from room ${event.room.name}`);
          await broadcastViewerCount(event.room.name);
        }
        break;

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
  // Only process call rooms (not assistant rooms)
  if (!roomName.startsWith('call-')) {
    return;
  }

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


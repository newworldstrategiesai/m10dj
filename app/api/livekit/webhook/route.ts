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
        // Track participant join (optional)
        if (event.room) {
          console.log(`Participant joined: ${event.participant?.identity} to room ${event.room.name}`);
        }
        break;

      case 'participant_left':
        // Track participant leave (optional)
        if (event.room) {
          console.log(`Participant left: ${event.participant?.identity} from room ${event.room.name}`);
        }
        break;

      default:
        console.log(`Unhandled LiveKit event: ${event.event}`);
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


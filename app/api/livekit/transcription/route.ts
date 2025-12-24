import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver, DataPacket_Kind } from 'livekit-server-sdk';

/**
 * Webhook endpoint for LiveKit transcription events
 * 
 * This receives transcription chunks from LiveKit when transcription is enabled.
 * Configure this URL in your LiveKit dashboard under Webhooks.
 * 
 * Note: Transcription must be enabled in LiveKit (Deepgram, Whisper, etc.)
 */

const livekitApiKey = process.env.LIVEKIT_API_KEY || '';
const livekitApiSecret = process.env.LIVEKIT_API_SECRET || '';

const receiver = new WebhookReceiver(
  livekitApiKey,
  livekitApiSecret
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

    // Handle transcription events
    // Note: LiveKit may not have these event types in the SDK yet, so we cast to any
    const eventType = (event as any).event;
    if (eventType === 'transcription_received' || eventType === 'transcription_final') {
      const transcription = (event as any).transcription;
      
      if (transcription) {
        const roomName = event.room?.name || '';
        const participantId = transcription.participantId || '';
        const text = transcription.text || '';
        const isFinal = eventType === 'transcription_final';
        
        // Only process admin-assistant rooms
        if (roomName.startsWith('assistant-')) {
          // Broadcast transcription to room via data channel
          // This allows the VoiceAssistant component to receive it
          const { RoomServiceClient } = await import('livekit-server-sdk');
          const livekitUrl = process.env.LIVEKIT_URL || '';
          const livekitApiKey = process.env.LIVEKIT_API_KEY || '';
          const livekitApiSecret = process.env.LIVEKIT_API_SECRET || '';
          
          if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
            console.error('LiveKit not configured');
            return NextResponse.json({ received: true });
          }
          
          const roomService = new RoomServiceClient(
            livekitUrl,
            livekitApiKey,
            livekitApiSecret
          );

          try {
            // Send transcription via data channel to room
            const dataPayload = JSON.stringify({
              type: 'transcription',
              text: text,
              isFinal: isFinal,
              participantId: participantId,
              timestamp: new Date().toISOString(),
            });
            
            await roomService.sendData(
              roomName,
              dataPayload,
              { kind: DataPacket_Kind.RELIABLE }
            );
          } catch (error) {
            console.error('Error sending transcription to room:', error);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing transcription webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


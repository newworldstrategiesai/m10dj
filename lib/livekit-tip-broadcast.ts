/**
 * Helper functions to broadcast tips to LiveKit rooms and Supabase channels
 * Call these from your Stripe webhook handler
 */

import { RoomServiceClient } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL!.replace('wss://', 'https://'),
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TipData {
  amount: number;
  name: string;
  message?: string;
  item?: string;
}

/**
 * Broadcast a tip to a LiveKit room and Supabase channel
 */
export async function broadcastTipToLiveStream(
  streamerUserId: string,
  tipData: TipData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get streamer's room name and stream ID
    const { data: stream } = await supabase
      .from('live_streams')
      .select('id, room_name, is_live')
      .eq('user_id', streamerUserId)
      .eq('is_live', true)
      .single();

    if (!stream || !stream.is_live) {
      // Stream is not live, but we can still broadcast to stream alerts
      return { success: true };
    }

    const roomName = stream.room_name;

    // 1. Update LiveKit room metadata (for the alert overlay)
    try {
      await roomService.updateRoomMetadata(roomName, JSON.stringify({
        lastTip: {
          amount: tipData.amount,
          name: tipData.name,
          message: tipData.message || '',
          timestamp: new Date().toISOString(),
        },
      }));
    } catch (error) {
      console.error('Error updating LiveKit metadata:', error);
      // Non-critical, continue
    }

    // 2. Broadcast to Supabase Realtime channel
    try {
      const channel = supabase.channel(`live_events:${roomName}`);
      await channel.send({
        type: 'broadcast',
        event: 'new_tip',
        payload: {
          amount: tipData.amount,
          name: tipData.name,
          message: tipData.message || '',
          item: tipData.item,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error broadcasting to Supabase:', error);
      // Non-critical, continue
    }

    // 3. Also broadcast to the stream alerts system (for OBS overlay)
    try {
      const alertsUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      await fetch(`${alertsUrl}/api/tipjar/stream-alerts/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: streamerUserId,
          event_type: 'tip',
          event_data: {
            amount: tipData.amount,
            name: tipData.name,
            message: tipData.message || '',
          },
        }),
      });
    } catch (error) {
      console.error('Error broadcasting to stream alerts:', error);
      // Non-critical - OBS overlay will still work via Supabase channel
    }

    // 4. Broadcast earnings update to streamer dashboard
    if (stream) {
      try {
        const earningsChannel = supabase.channel(`earnings:${stream.id}`);
        await earningsChannel.send({
          type: 'broadcast',
          event: 'earnings_update',
          payload: {
            // This would query actual earnings from database
            // For now, just notify of new tip
            tip_amount: tipData.amount,
          },
        });
      } catch (error) {
        console.error('Error broadcasting earnings:', error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error broadcasting tip to live stream:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


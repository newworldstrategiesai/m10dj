/**
 * Publish real-time notifications via LiveKit data channels
 * Falls back to Supabase channels if LiveKit room doesn't exist
 */

import { RoomServiceClient, DataPacket_Kind } from 'livekit-server-sdk';
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

export interface AdminNotification {
  type: 'new_lead' | 'payment' | 'contract_signed' | 'status_change' | 'message' | 'reminder';
  title: string;
  message: string;
  data?: {
    contactId?: string;
    quoteId?: string;
    invoiceId?: string;
    amount?: number;
    [key: string]: any;
  };
  timestamp?: string;
  priority?: 'low' | 'medium' | 'high';
}

export async function publishAdminNotification(
  adminUserId: string,
  notification: AdminNotification
): Promise<{ success: boolean; method: 'livekit' | 'supabase' | 'none'; error?: string }> {
  const roomName = `assistant-${adminUserId}`;
  const timestamp = notification.timestamp || new Date().toISOString();

  const notificationPayload = {
    ...notification,
    timestamp,
  };

  // Try LiveKit data channel first (if admin is connected)
  try {
    // Check if room exists and has participants
    const participants = await roomService.listParticipants(roomName);
    
    if (participants.length > 0) {
      // Admin is connected - send via LiveKit
      await roomService.sendData(
        roomName,
        JSON.stringify({
          type: 'notification',
          ...notificationPayload,
        }),
        { kind: DataPacket_Kind.RELIABLE }
      );

      return { success: true, method: 'livekit' };
    }
  } catch (error) {
    // Room doesn't exist or error - fall back to Supabase
    console.log('LiveKit notification failed, using Supabase fallback:', error);
  }

  // Fallback: Use Supabase Realtime channel
  try {
    const channel = supabase.channel(`admin-notifications:${adminUserId}`);
    await channel.send({
      type: 'broadcast',
      event: 'notification',
      payload: notificationPayload,
    });

    return { success: true, method: 'supabase' };
  } catch (error) {
    console.error('Error publishing notification:', error);
    return {
      success: false,
      method: 'none',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Broadcast notification to all active admin users
 */
export async function broadcastToAllAdmins(
  notification: AdminNotification
): Promise<{ success: boolean; sentTo: number; errors: string[] }> {
  const errors: string[] = [];
  let sentTo = 0;

  try {
    // Get all active admin users
    const { data: admins, error: adminError } = await supabase
      .from('admin_roles')
      .select('user_id, email')
      .eq('is_active', true);

    if (adminError || !admins) {
      return { success: false, sentTo: 0, errors: ['Failed to fetch admins'] };
    }

    // Send to each admin
    for (const admin of admins) {
      if (admin.user_id) {
        const result = await publishAdminNotification(admin.user_id, notification);
        if (result.success) {
          sentTo++;
        } else if (result.error) {
          errors.push(`Failed to notify ${admin.email}: ${result.error}`);
        }
      }
    }

    return { success: sentTo > 0, sentTo, errors };
  } catch (error) {
    return {
      success: false,
      sentTo: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}


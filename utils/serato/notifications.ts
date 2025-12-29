/**
 * Notification system for Serato play detection
 * 
 * Sends SMS and email notifications to requesters when their song plays.
 * Uses existing notification infrastructure (Twilio, Resend).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { Resend } from 'resend';

// Initialize Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface NotificationRequest {
  id: string;
  song_artist: string;
  song_title: string;
  requester_phone: string | null;
  requester_email: string | null;
}

interface NotificationResult {
  sms: { success: boolean; error?: string };
  email: { success: boolean; error?: string };
}

/**
 * Send notification to requester that their song is playing
 */
export async function sendRequestPlayingNotification(
  request: NotificationRequest,
  supabase: SupabaseClient
): Promise<NotificationResult> {
  const result: NotificationResult = {
    sms: { success: false },
    email: { success: false }
  };

  const message = `🎵 Your song is playing!\n\n"${request.song_title}" by ${request.song_artist}`;

  // Send SMS
  if (request.requester_phone && twilioClient) {
    try {
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) {
        throw new Error('TWILIO_PHONE_NUMBER not configured');
      }

      await twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to: request.requester_phone
      });

      result.sms.success = true;
      console.log(`[Serato Notification] SMS sent to ${request.requester_phone}`);
    } catch (error: any) {
      result.sms.error = error.message;
      console.error('[Serato Notification] SMS error:', error.message);
    }
  }

  // Send Email
  if (request.requester_email && resend) {
    try {
      const fromEmail = process.env.NOTIFICATION_EMAIL_FROM || 'notifications@m10djcompany.com';

      await resend.emails.send({
        from: fromEmail,
        to: request.requester_email,
        subject: '🎵 Your song is playing!',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; margin-bottom: 10px;">Your song is playing! 🎵</h1>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
              <p style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0;">${request.song_title}</p>
              <p style="font-size: 18px; margin: 0; opacity: 0.9;">by ${request.song_artist}</p>
            </div>
            <p style="color: #666; font-size: 14px; text-align: center;">Thanks for making a request! Enjoy the music! 🎶</p>
          </div>
        `
      });

      result.email.success = true;
      console.log(`[Serato Notification] Email sent to ${request.requester_email}`);
    } catch (error: any) {
      result.email.error = error.message;
      console.error('[Serato Notification] Email error:', error.message);
    }
  }

  // Mark notification as sent in database
  if (result.sms.success || result.email.success) {
    try {
      await supabase
        .from('crowd_requests')
        .update({
          notification_sent: true,
          notification_sent_at: new Date().toISOString()
        })
        .eq('id', request.id);
    } catch (error) {
      console.error('[Serato Notification] Error updating notification status:', error);
    }
  }

  return result;
}

/**
 * Check if notification services are configured
 */
export function getNotificationStatus(): { sms: boolean; email: boolean } {
  return {
    sms: twilioClient !== null,
    email: resend !== null
  };
}


import { sendBookingReminderEmail } from '../../../utils/booking-emails';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Cron job endpoint to send reminder emails 24 hours before meetings
 * Should be called daily (e.g., via Vercel Cron or external cron service)
 */
export default async function handler(req, res) {
  // Optional: Add authentication for cron jobs
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get bookings scheduled for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    // Find bookings that:
    // 1. Are scheduled for tomorrow
    // 2. Are in 'scheduled' or 'confirmed' status
    // 3. Haven't had a reminder sent yet
    const { data: bookings, error } = await supabase
      .from('meeting_bookings')
      .select(`
        *,
        meeting_types (
          name,
          description
        )
      `)
      .eq('meeting_date', tomorrowDate)
      .in('status', ['scheduled', 'confirmed'])
      .is('reminder_sent_at', null);

    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No reminders to send',
        count: 0
      });
    }

    // Send reminders for each booking
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const emailData = {
          bookingId: booking.id,
          clientName: booking.client_name,
          clientEmail: booking.client_email,
          clientPhone: booking.client_phone,
          meetingType: booking.meeting_types?.name || 'Consultation',
          meetingDate: booking.meeting_date,
          meetingTime: booking.meeting_time,
          durationMinutes: booking.duration_minutes,
          eventType: booking.event_type,
          eventDate: booking.event_date,
          notes: booking.notes,
          meetingDescription: booking.meeting_types?.description || null,
          videoCallLink: booking.video_call_link || null
        };

        const result = await sendBookingReminderEmail(emailData);

        if (result.success) {
          // Mark reminder as sent
          await supabase
            .from('meeting_bookings')
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq('id', booking.id);
        }

        return { bookingId: booking.id, success: result.success, error: result.error };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return res.status(200).json({
      success: true,
      message: `Sent ${successful} reminders, ${failed} failed`,
      total: bookings.length,
      successful,
      failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send reminders'
    });
  }
}


import { sendBookingConfirmationEmail, sendAdminBookingNotification } from '../../../utils/booking-emails';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      bookingId,
      clientName,
      clientEmail,
      clientPhone,
      meetingType,
      meetingDate,
      meetingTime,
      durationMinutes,
      eventType,
      eventDate,
      notes,
      meetingDescription,
      videoCallLink
    } = req.body;

    if (!bookingId || !clientName || !clientEmail || !meetingType || !meetingDate || !meetingTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailData = {
      bookingId,
      clientName,
      clientEmail,
      clientPhone,
      meetingType,
      meetingDate,
      meetingTime,
      durationMinutes: durationMinutes || 30,
      eventType,
      eventDate,
      notes,
      meetingDescription,
      videoCallLink: videoCallLink || null
    };

    // Send both emails in parallel
    const [clientResult, adminResult] = await Promise.allSettled([
      sendBookingConfirmationEmail(emailData),
      sendAdminBookingNotification(emailData)
    ]);

    // Log results
    if (clientResult.status === 'fulfilled' && clientResult.value.success) {
      console.log('✅ Client confirmation email sent');
    } else {
      console.error('❌ Failed to send client confirmation email:', clientResult.reason || clientResult.value?.error);
    }

    if (adminResult.status === 'fulfilled' && adminResult.value.success) {
      console.log('✅ Admin notification email sent');
    } else {
      console.error('❌ Failed to send admin notification email:', adminResult.reason || adminResult.value?.error);
    }

    // Update booking record to mark confirmation sent
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase
      .from('meeting_bookings')
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq('id', bookingId);

    return res.status(200).json({
      success: true,
      clientEmail: clientResult.status === 'fulfilled' && clientResult.value.success,
      adminEmail: adminResult.status === 'fulfilled' && adminResult.value.success
    });
  } catch (error) {
    console.error('Error sending confirmation emails:', error);
    return res.status(500).json({ error: 'Failed to send confirmation emails' });
  }
}


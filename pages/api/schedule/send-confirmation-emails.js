import { sendBookingConfirmationEmail, sendAdminBookingNotification } from '../../../utils/booking-emails';
import { createClient } from '@supabase/supabase-js';

/**
 * Ensure contact exists for a schedule booking (form submission).
 * Find or create contact, then link to meeting_booking.
 */
async function ensureContactForBooking(supabase, { clientName, clientEmail, clientPhone, eventType, eventDate, bookingId }) {
  const email = (clientEmail || '').toLowerCase().trim();
  if (!email) return null;

  let organizationId = null;
  let adminUserId = process.env.DEFAULT_ADMIN_USER_ID;
  if (!adminUserId) {
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const adminEmails = ['djbenmurray@gmail.com', 'admin@m10djcompany.com', 'manager@m10djcompany.com'];
      const adminUser = authUsers?.users?.find(u => adminEmails.includes(u.email || ''));
      if (adminUser) adminUserId = adminUser.id;
    } catch (e) {
      console.warn('Could not get admin user for contact creation:', e.message);
    }
  }
  if (adminUserId) {
    const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', adminUserId).single();
    if (org) organizationId = org.id;
  }

  const nameParts = (clientName || '').trim().split(' ');
  const firstName = nameParts[0] || 'Unknown';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Customer';

  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('email_address', email)
    .is('deleted_at', null)
    .maybeSingle();

  if (existing) {
    await supabase.from('meeting_bookings').update({ contact_id: existing.id, updated_at: new Date().toISOString() }).eq('id', bookingId);
    return existing.id;
  }

  const contactData = {
    user_id: adminUserId || null,
    organization_id: organizationId,
    first_name: firstName,
    last_name: lastName,
    email_address: email,
    phone: clientPhone || null,
    event_type: eventType || 'other',
    event_date: eventDate || null,
    lead_status: 'New',
    lead_source: 'Website',
    lead_stage: 'Consultation Scheduled',
    lead_temperature: 'Warm',
    communication_preference: 'email',
    how_heard_about_us: 'Schedule Booking',
    notes: `Scheduled consultation via website on ${new Date().toLocaleDateString()}`,
    last_contacted_date: new Date().toISOString(),
    last_contact_type: 'schedule_booking',
    opt_in_status: true,
    lead_score: 50,
    priority_level: 'Medium'
  };

  const { data: newContact, error } = await supabase.from('contacts').insert([contactData]).select('id').single();
  if (error) {
    console.warn('⚠️ Could not create contact for schedule booking:', error.message);
    return null;
  }
  await supabase.from('meeting_bookings').update({ contact_id: newContact.id, updated_at: new Date().toISOString() }).eq('id', bookingId);
  console.log('✅ Created contact for schedule booking:', newContact.id);
  return newContact.id;
}

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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Ensure contact exists and is linked to booking (form submission -> contact)
    await ensureContactForBooking(supabase, {
      clientName,
      clientEmail,
      clientPhone,
      eventType,
      eventDate,
      bookingId
    });

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


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Webhook endpoint for Resend email open tracking
 * POST /api/webhooks/resend-email-opened
 * 
 * This endpoint receives webhook events from Resend when emails are opened.
 * Resend sends events for: email.sent, email.delivered, email.opened, email.clicked, etc.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    
    // Resend webhook events have this structure:
    // {
    //   type: 'email.opened',
    //   created_at: '2024-01-01T00:00:00.000Z',
    //   data: {
    //     email_id: 'xxx',
    //     to: ['customer@example.com'],
    //     from: 'hello@m10djcompany.com',
    //     subject: '...',
    //     created_at: '2024-01-01T00:00:00.000Z'
    //   }
    // }

    console.log('📧 Resend webhook event received:', event.type);

    // Only process email.opened events
    if (event.type !== 'email.opened') {
      console.log(`ℹ️ Ignoring event type: ${event.type}`);
      return res.status(200).json({ received: true, processed: false });
    }

    const { email_id, to, from, subject, created_at } = event.data || {};

    if (!email_id || !to || !Array.isArray(to) || to.length === 0) {
      console.warn('⚠️ Missing required fields in webhook event');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const recipientEmail = to[0]; // Get first recipient
    const openedAt = created_at || new Date().toISOString();

    console.log(`📬 Email opened: ${email_id}`);
    console.log(`   Recipient: ${recipientEmail}`);
    console.log(`   Opened at: ${openedAt}`);

    // Find the contact by email
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, email_address, first_name, last_name')
      .eq('email_address', recipientEmail)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (contactError) {
      console.error('❌ Error finding contact:', contactError);
    }

    // Store email open event in database
    // Create or update email_tracking table entry
    const trackingData = {
      email_id: email_id,
      recipient_email: recipientEmail,
      sender_email: from,
      subject: subject,
      event_type: 'opened',
      opened_at: openedAt,
      contact_id: contact?.id || null,
      metadata: {
        email_id,
        recipient: recipientEmail,
        sender: from,
        subject,
        contact_name: contact ? `${contact.first_name} ${contact.last_name}`.trim() : null
      },
      created_at: new Date().toISOString()
    };

    // Try to insert into email_tracking table
    const { data: trackingRecord, error: trackingError } = await supabase
      .from('email_tracking')
      .insert(trackingData)
      .select()
      .single();

    if (trackingError) {
      // If table doesn't exist, log it but don't fail
      console.error('⚠️ Error storing email tracking:', trackingError);
      console.log('📝 Email open event logged (table may not exist):', {
        email_id,
        recipient: recipientEmail,
        opened_at: openedAt,
        contact_id: contact?.id
      });
    } else {
      console.log('✅ Email open event stored:', trackingRecord.id);
    }

    // Update contact's last_email_opened_at if contact found
    if (contact?.id) {
      await supabase
        .from('contacts')
        .update({
          last_email_opened_at: openedAt,
          last_email_opened_type: 'confirmation',
          updated_at: new Date().toISOString()
        })
        .eq('id', contact.id);
      
      console.log(`✅ Updated contact ${contact.id} with email open timestamp`);
    }

    res.status(200).json({ 
      received: true, 
      processed: true,
      email_id,
      recipient: recipientEmail,
      contact_id: contact?.id || null
    });

  } catch (error) {
    console.error('❌ Error processing Resend webhook:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}


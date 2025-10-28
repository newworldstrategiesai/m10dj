/**
 * Trigger Event Complete Automation
 * Call this when an event is completed to start automated review sequence
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Your Google Business Place ID for direct review link
const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID || 'YOUR_PLACE_ID_HERE';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId, contactId } = req.body;

  if (!eventId && !contactId) {
    return res.status(400).json({ error: 'eventId or contactId required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get event and contact details
    let event, contact;

    if (eventId) {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*, contacts(*)')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      event = eventData;
      contact = eventData.contacts;
    } else {
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactError) throw contactError;
      contact = contactData;
    }

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Generate direct Google review link
    const reviewLink = `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`;

    // Update contact with review link
    await supabase
      .from('contacts')
      .update({
        google_review_link: reviewLink,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);

    // Mark event as completed
    if (event) {
      await supabase
        .from('events')
        .update({
          event_completed: true,
          event_completed_at: new Date().toISOString()
        })
        .eq('id', event.id);
    }

    // Schedule automation sequence
    const now = new Date();
    const automations = [];

    // 1. Thank you + Review request (48 hours after event)
    automations.push({
      automation_type: 'review_request',
      contact_id: contact.id,
      event_id: event?.id || null,
      scheduled_for: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      priority: 8,
      metadata: {
        template: 'post_event_thank_you',
        review_link: reviewLink,
        event_type: event?.event_type || 'event',
        event_date: event?.event_date || null
      }
    });

    // 2. First reminder (7 days after event, if no review)
    automations.push({
      automation_type: 'review_reminder',
      contact_id: contact.id,
      event_id: event?.id || null,
      scheduled_for: new Date(now.getTime() + 168 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      priority: 6,
      metadata: {
        template: 'review_reminder_1',
        review_link: reviewLink,
        event_type: event?.event_type || 'event',
        reminder_number: 1
      }
    });

    // 3. Second reminder (14 days after event, if no review)
    automations.push({
      automation_type: 'review_reminder',
      contact_id: contact.id,
      event_id: event?.id || null,
      scheduled_for: new Date(now.getTime() + 336 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      priority: 5,
      metadata: {
        template: 'review_reminder_2',
        review_link: reviewLink,
        incentive: 'starbucks_gift_card',
        reminder_number: 2
      }
    });

    // Insert all automations
    const { data: createdAutomations, error: automationError } = await supabase
      .from('automation_queue')
      .insert(automations)
      .select();

    if (automationError) throw automationError;

    console.log(`✅ Scheduled ${automations.length} automations for contact ${contact.id}`);

    // Log the automation creation
    await supabase.from('automation_log').insert({
      automation_type: 'sequence_started',
      contact_id: contact.id,
      event_id: event?.id || null,
      template_used: 'event_complete_sequence',
      email_sent: false,
      sent_at: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      contact_id: contact.id,
      event_id: event?.id || null,
      automations_scheduled: createdAutomations.length,
      review_link: reviewLink
    });

  } catch (error) {
    console.error('❌ Error triggering event complete automation:', error);
    res.status(500).json({ 
      error: 'Automation failed',
      message: error.message 
    });
  }
}


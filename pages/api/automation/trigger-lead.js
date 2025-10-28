/**
 * Trigger Lead Follow-up Automation
 * Call this when a new lead comes in (email, form submission, etc.)
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contactId } = req.body;

  if (!contactId) {
    return res.status(400).json({ error: 'contactId required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError) throw contactError;

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Don't send follow-ups if lead status is already booked or beyond initial inquiry
    if (['Booked', 'Completed', 'Lost'].includes(contact.lead_status)) {
      return res.status(200).json({
        success: true,
        message: 'No follow-up needed for this lead status',
        skipped: true
      });
    }

    // Schedule lead follow-up sequence
    const now = new Date();
    const automations = [];

    // 1. First follow-up (3 days after initial inquiry)
    automations.push({
      automation_type: 'follow_up',
      contact_id: contact.id,
      scheduled_for: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      priority: 7,
      metadata: {
        template: 'lead_follow_up_1',
        follow_up_number: 1,
        event_type: contact.event_type || 'event',
        event_date: contact.event_date
      }
    });

    // 2. Second follow-up (7 days after initial inquiry)
    automations.push({
      automation_type: 'follow_up',
      contact_id: contact.id,
      scheduled_for: new Date(now.getTime() + 168 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      priority: 5,
      metadata: {
        template: 'lead_follow_up_2',
        follow_up_number: 2,
        event_type: contact.event_type || 'event'
      }
    });

    // Insert automations
    const { data: createdAutomations, error: automationError } = await supabase
      .from('automation_queue')
      .insert(automations)
      .select();

    if (automationError) throw automationError;

    console.log(`✅ Scheduled ${automations.length} follow-ups for lead ${contact.id}`);

    // Log the automation
    await supabase.from('automation_log').insert({
      automation_type: 'lead_sequence_started',
      contact_id: contact.id,
      template_used: 'lead_follow_up_sequence',
      email_sent: false,
      sent_at: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      contact_id: contact.id,
      automations_scheduled: createdAutomations.length
    });

  } catch (error) {
    console.error('❌ Error triggering lead automation:', error);
    res.status(500).json({ 
      error: 'Automation failed',
      message: error.message 
    });
  }
}


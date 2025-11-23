import { createClient } from '@supabase/supabase-js';
import { notifyEventConfirmation } from '../../../utils/client-notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Send event confirmation notifications (1 week before event)
 * This should be called daily via cron job
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify this is an authorized request (e.g., from cron job with secret)
  const authSecret = req.headers['x-cron-secret'] || req.body.secret;
  if (authSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find events happening in 7 days
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find contacts with events in 7 days who:
    // 1. Have paid (payment_status = 'paid' or 'partial')
    // 2. Have a signed contract
    // 3. Haven't received confirmation notification yet
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email_address, phone, event_type, event_date, venue_name, venue_address')
      .eq('event_date', targetDate.toISOString().split('T')[0])
      .in('payment_status', ['paid', 'partial'])
      .not('event_date', 'is', null);

    if (error) {
      console.error('Error fetching contacts for confirmation:', error);
      return res.status(500).json({ error: 'Failed to fetch contacts', details: error.message });
    }

    if (!contacts || contacts.length === 0) {
      return res.status(200).json({ 
        message: 'No events need confirmation',
        count: 0,
        sent: 0
      });
    }

    // Filter out contacts that have already received confirmation
    const contactsNeedingConfirmation = [];
    for (const contact of contacts) {
      // Check if confirmation was already sent
      const { data: existingConfirmation } = await supabase
        .from('followup_sent')
        .select('id')
        .eq('contact_id', contact.id)
        .eq('followup_type', 'event_confirmation')
        .limit(1);

      if (!existingConfirmation || existingConfirmation.length === 0) {
        contactsNeedingConfirmation.push(contact);
      }
    }

    // Send confirmations
    const results = [];
    for (const contact of contactsNeedingConfirmation) {
      try {
        await notifyEventConfirmation(contact.id, {
          event_date: contact.event_date,
          venue_name: contact.venue_name,
          venue_address: contact.venue_address
        });
        
        // Mark as sent
        await supabase.from('followup_sent').insert({
          contact_id: contact.id,
          followup_type: 'event_confirmation',
          sent_at: new Date().toISOString(),
          metadata: { 
            event_date: contact.event_date,
            days_until_event: 7
          }
        });
        
        results.push({ contactId: contact.id, success: true });
      } catch (error) {
        console.error(`Error sending confirmation to ${contact.id}:`, error);
        results.push({ contactId: contact.id, success: false, error: error.message });
      }
    }

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return res.status(200).json({
      message: `Processed event confirmations`,
      found: contactsNeedingConfirmation.length,
      sent,
      failed,
      results
    });

  } catch (error) {
    console.error('Error in event confirmation check:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}


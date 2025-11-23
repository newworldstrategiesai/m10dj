import { createClient } from '@supabase/supabase-js';
import { notifyMusicQuestionnaireReminder } from '../../../utils/client-notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check for clients who need music questionnaire reminders
 * This should be called daily via cron job
 * 
 * Sends reminders:
 * - 14 days before event (first reminder)
 * - 7 days before event (urgent reminder)
 * - 3 days before event (final reminder)
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
    const results = {
      day14: { found: 0, sent: 0, failed: 0 },
      day7: { found: 0, sent: 0, failed: 0 },
      day3: { found: 0, sent: 0, failed: 0 }
    };

    // Check for events 14 days away
    const day14Contacts = await findContactsNeedingReminder(14, 'day14');
    results.day14.found = day14Contacts.length;
    for (const contact of day14Contacts) {
      try {
        await notifyMusicQuestionnaireReminder(contact.id, 14);
        results.day14.sent++;
      } catch (error) {
        console.error(`Error sending day14 reminder to ${contact.id}:`, error);
        results.day14.failed++;
      }
    }

    // Check for events 7 days away
    const day7Contacts = await findContactsNeedingReminder(7, 'day7');
    results.day7.found = day7Contacts.length;
    for (const contact of day7Contacts) {
      try {
        await notifyMusicQuestionnaireReminder(contact.id, 7);
        results.day7.sent++;
      } catch (error) {
        console.error(`Error sending day7 reminder to ${contact.id}:`, error);
        results.day7.failed++;
      }
    }

    // Check for events 3 days away
    const day3Contacts = await findContactsNeedingReminder(3, 'day3');
    results.day3.found = day3Contacts.length;
    for (const contact of day3Contacts) {
      try {
        await notifyMusicQuestionnaireReminder(contact.id, 3);
        results.day3.sent++;
      } catch (error) {
        console.error(`Error sending day3 reminder to ${contact.id}:`, error);
        results.day3.failed++;
      }
    }

    const totalSent = results.day14.sent + results.day7.sent + results.day3.sent;
    const totalFailed = results.day14.failed + results.day7.failed + results.day3.failed;

    return res.status(200).json({
      message: `Processed music questionnaire reminders`,
      results,
      summary: {
        totalFound: results.day14.found + results.day7.found + results.day3.found,
        totalSent,
        totalFailed
      }
    });

  } catch (error) {
    console.error('Error in music questionnaire reminder check:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

/**
 * Find contacts with events X days away who need questionnaire reminders
 */
async function findContactsNeedingReminder(daysUntilEvent, reminderType) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysUntilEvent);
  targetDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Find contacts with events on the target date who:
  // 1. Have a signed contract (payment_status = 'paid' or contract signed)
  // 2. Haven't received this specific reminder yet
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email_address, phone, event_type, event_date')
    .eq('event_date', targetDate.toISOString().split('T')[0])
    .in('payment_status', ['paid', 'partial'])
    .not('event_date', 'is', null);

  if (error) {
    console.error('Error fetching contacts for reminder:', error);
    return [];
  }

  if (!contacts || contacts.length === 0) {
    return [];
  }

  // Filter out contacts that have already received this reminder
  const contactsNeedingReminder = [];
  for (const contact of contacts) {
    // Check if reminder was already sent
    const { data: existingReminder } = await supabase
      .from('followup_sent')
      .select('id')
      .eq('contact_id', contact.id)
      .eq('followup_type', `music_questionnaire_${reminderType}`)
      .limit(1);

    if (!existingReminder || existingReminder.length === 0) {
      contactsNeedingReminder.push(contact);
    }
  }

  // Mark reminders as sent
  for (const contact of contactsNeedingReminder) {
    await supabase.from('followup_sent').insert({
      contact_id: contact.id,
      followup_type: `music_questionnaire_${reminderType}`,
      sent_at: new Date().toISOString(),
      metadata: { 
        days_until_event: daysUntilEvent,
        event_date: contact.event_date
      }
    });
  }

  return contactsNeedingReminder;
}


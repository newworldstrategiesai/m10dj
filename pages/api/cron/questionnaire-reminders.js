import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Cron job to automatically send reminders for incomplete questionnaires
 * This should be run daily (e.g., via Vercel Cron)
 * 
 * Reminder schedule:
 * - First reminder: 2 days after started_at
 * - Second reminder: 5 days after started_at
 * - Third reminder: 10 days after started_at
 * - Maximum 3 reminders per questionnaire
 */
export default async function handler(req, res) {
  // Verify this is a cron job request (optional security check)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const results = {
      checked: 0,
      remindersSent: 0,
      errors: []
    };

    // Find all incomplete questionnaires that have been started
    const { data: incompleteQuestionnaires, error: fetchError } = await supabase
      .from('music_questionnaires')
      .select('*')
      .is('completed_at', null)
      .not('started_at', 'is', null);

    if (fetchError) {
      console.error('Error fetching incomplete questionnaires:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch questionnaires', details: fetchError.message });
    }

    results.checked = incompleteQuestionnaires?.length || 0;

    if (!incompleteQuestionnaires || incompleteQuestionnaires.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No incomplete questionnaires found',
        results
      });
    }

    // Process each incomplete questionnaire
    for (const questionnaire of incompleteQuestionnaires) {
      try {
        const startedAt = new Date(questionnaire.started_at);
        const daysSinceStarted = (now - startedAt) / (1000 * 60 * 60 * 24);
        const reminderCount = questionnaire.reminder_count || 0;
        const lastReminderSent = questionnaire.last_reminder_sent_at 
          ? new Date(questionnaire.last_reminder_sent_at)
          : null;
        const daysSinceLastReminder = lastReminderSent 
          ? (now - lastReminderSent) / (1000 * 60 * 60 * 24)
          : null;

        // Determine if a reminder should be sent
        let shouldSendReminder = false;
        let reminderReason = '';

        if (reminderCount === 0 && daysSinceStarted >= 2) {
          // First reminder: 2 days after start
          shouldSendReminder = true;
          reminderReason = 'First reminder (2 days after start)';
        } else if (reminderCount === 1 && daysSinceStarted >= 5 && (!daysSinceLastReminder || daysSinceLastReminder >= 2)) {
          // Second reminder: 5 days after start, at least 2 days since last reminder
          shouldSendReminder = true;
          reminderReason = 'Second reminder (5 days after start)';
        } else if (reminderCount === 2 && daysSinceStarted >= 10 && (!daysSinceLastReminder || daysSinceLastReminder >= 3)) {
          // Third reminder: 10 days after start, at least 3 days since last reminder
          shouldSendReminder = true;
          reminderReason = 'Third reminder (10 days after start)';
        }

        if (!shouldSendReminder) {
          continue;
        }

        // Don't send more than 3 reminders
        if (reminderCount >= 3) {
          continue;
        }

        // Fetch contact information
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email_address, event_date')
          .eq('id', questionnaire.lead_id)
          .single();

        if (contactError || !contact || !contact.email_address) {
          console.warn(`⚠️ Skipping questionnaire ${questionnaire.lead_id}: Contact not found or no email`);
          results.errors.push({
            leadId: questionnaire.lead_id,
            error: 'Contact not found or no email address'
          });
          continue;
        }

        // Send reminder via API
        const reminderResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/questionnaire/send-reminder`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              leadId: questionnaire.lead_id,
              manual: false
            })
          }
        );

        if (reminderResponse.ok) {
          results.remindersSent++;
          console.log(`✅ Sent reminder for questionnaire ${questionnaire.lead_id}: ${reminderReason}`);
        } else {
          const errorData = await reminderResponse.json();
          results.errors.push({
            leadId: questionnaire.lead_id,
            error: errorData.error || 'Unknown error'
          });
          console.error(`❌ Failed to send reminder for ${questionnaire.lead_id}:`, errorData);
        }

      } catch (error) {
        results.errors.push({
          leadId: questionnaire.lead_id,
          error: error.message
        });
        console.error(`❌ Error processing questionnaire ${questionnaire.lead_id}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${results.checked} questionnaires, sent ${results.remindersSent} reminders`,
      results
    });

  } catch (error) {
    console.error('Error in questionnaire reminders cron:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

// For Vercel Cron configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}


import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, manual = false } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Fetch questionnaire and contact data
    const { data: questionnaire, error: qError } = await supabase
      .from('music_questionnaires')
      .select('*')
      .eq('lead_id', leadId)
      .single();

    if (qError || !questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    // Don't send reminder if already completed
    if (questionnaire.completed_at) {
      return res.status(400).json({ error: 'Questionnaire is already completed' });
    }

    // Fetch contact information
    const { data: contact, error: cError } = await supabase
      .from('contacts')
      .select('first_name, last_name, email_address, phone, event_date')
      .eq('id', leadId)
      .single();

    if (cError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (!contact.email_address) {
      return res.status(400).json({ error: 'Contact email address not found' });
    }

    // Check if reminder was sent recently (within last 24 hours) unless manual
    if (!manual) {
      const lastReminder = questionnaire.last_reminder_sent_at;
      if (lastReminder) {
        const hoursSinceLastReminder = (Date.now() - new Date(lastReminder).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastReminder < 24) {
          return res.status(400).json({ 
            error: 'Reminder was sent recently',
            hoursSinceLastReminder: Math.round(hoursSinceLastReminder)
          });
        }
      }
    }

    // Determine missing information
    const missingInfo = [];
    if (!questionnaire.big_no_songs || questionnaire.big_no_songs.trim() === '') {
      missingInfo.push('Songs you don\'t want to hear');
    }
    if (!questionnaire.special_dances || questionnaire.special_dances.length === 0) {
      missingInfo.push('Special dance selections');
    }
    if (questionnaire.special_dances && questionnaire.special_dances.length > 0) {
      const missingSongs = questionnaire.special_dances.filter(
        dance => !questionnaire.special_dance_songs || !questionnaire.special_dance_songs[dance]
      );
      if (missingSongs.length > 0) {
        missingInfo.push(`Song selections for: ${missingSongs.join(', ')}`);
      }
    }
    if (!questionnaire.playlist_links || 
        (!questionnaire.playlist_links.reception && !questionnaire.playlist_links.ceremony && !questionnaire.playlist_links.cocktail)) {
      missingInfo.push('Playlist links (optional)');
    }

    // Get quote ID from lead ID (assuming they're the same or we need to look it up)
    const quoteId = leadId;
    const questionnaireUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${quoteId}/questionnaire`;

    // Build email content
    const firstName = contact.first_name || contact.email_address.split('@')[0];
    const eventDateText = contact.event_date 
      ? ` for your event on ${new Date(contact.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #000; margin: 0; font-size: 28px;">Complete Your Music Questionnaire</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
          <p style="font-size: 16px; margin-top: 0;">Hi ${firstName},</p>
          
          <p style="font-size: 16px;">
            We noticed you started filling out your music questionnaire but haven't finished yet${eventDateText}. 
            We'd love to help you complete it so we can create the perfect soundtrack for your special day!
          </p>
          
          ${missingInfo.length > 0 ? `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #fcba00; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Still need to complete:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${missingInfo.map(item => `<li style="margin: 8px 0;">${item}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${questionnaireUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #fcba00, #e6a800); color: #000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              Complete Questionnaire →
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This should only take a few minutes, and it helps us ensure your event music is exactly what you envision!
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            If you have any questions or need help, feel free to reply to this email or call us at (901) 410-2020.
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Best regards,<br>
            <strong>The M10 DJ Company Team</strong>
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email
    if (!resend) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: contact.email_address,
      subject: `Complete Your Music Questionnaire${eventDateText ? ` - ${new Date(contact.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`,
      html: emailHtml
    });

    // Update questionnaire with reminder tracking
    const now = new Date().toISOString();
    await supabase
      .from('music_questionnaires')
      .update({
        last_reminder_sent_at: now,
        reminder_count: (questionnaire.reminder_count || 0) + 1
      })
      .eq('lead_id', leadId);

    return res.status(200).json({
      success: true,
      message: 'Reminder sent successfully',
      reminderCount: (questionnaire.reminder_count || 0) + 1
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}


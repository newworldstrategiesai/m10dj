/**
 * Review Request API Endpoint
 * 
 * Sends review request emails to clients post-event
 * 
 * Usage:
 * POST /api/review-request/send
 * Body: { contactId, eventDate, eventType, clientName, clientEmail, venueName }
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateReviewRequestEmail, generateReviewRequestSubject } from '../../utils/review-generation';

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
    const { contactId, eventDate, eventType, clientName, clientEmail, venueName, djName } = req.body;

    // Validate required fields
    if (!contactId || !eventDate || !eventType || !clientName || !clientEmail) {
      return res.status(400).json({ 
        error: 'Missing required fields: contactId, eventDate, eventType, clientName, clientEmail' 
      });
    }

    // Generate review request email
    const emailHtml = generateReviewRequestEmail({
      clientName,
      clientEmail,
      eventType,
      eventDate,
      venueName,
      djName
    });

    const subject = generateReviewRequestSubject(eventType);

    // Send email via Resend
    if (!resend) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'M10 DJ Company <info@m10djcompany.com>',
      to: clientEmail,
      subject: subject,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending review request email:', emailError);
      return res.status(500).json({ error: 'Failed to send email', details: emailError });
    }

    // Update contact record to track review request
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        review_requested: true,
        last_contacted_date: new Date().toISOString(),
        last_contact_type: 'email',
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId);

    if (updateError) {
      console.error('Error updating contact record:', updateError);
      // Don't fail the request if update fails, email was sent
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Review request email sent successfully',
      emailId: emailData?.id
    });

  } catch (error) {
    console.error('Error in review request handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}


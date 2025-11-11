import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

interface ResendAttachment {
  id: string;
  filename: string;
  content_type: string;
  content_disposition: string;
  content_id?: string;
}

interface ResendEmailReceivedEvent {
  type: 'email.received';
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    bcc: string[];
    cc: string[];
    message_id: string;
    subject: string;
    html?: string;
    text?: string;
    attachments: ResendAttachment[];
    headers?: Record<string, string>;
    spam_score?: number;
    reply_to?: string;
  };
}

/**
 * Webhook endpoint to receive emails from Resend
 * 
 * Setup in Resend:
 * 1. Go to https://resend.com/webhooks
 * 2. Add webhook URL: https://yourdomain.com/api/webhooks/resend-email-received
 * 3. Select event: email.received
 * 4. (Optional) Add webhook signature verification
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event: ResendEmailReceivedEvent = req.body;

    // Validate event type
    if (event.type !== 'email.received') {
      console.log('[Resend Webhook] Ignoring non-email event:', event.type);
      return res.status(200).json({ message: 'Event ignored' });
    }

    console.log('[Resend Webhook] Received email:', {
      email_id: event.data.email_id,
      from: event.data.from,
      to: event.data.to,
      subject: event.data.subject,
    });

    // TODO: Add webhook signature verification for security
    // See: https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests

    // Parse from email (format: "Name <email@domain.com>" or "email@domain.com")
    const fromMatch = event.data.from.match(/<(.+)>/) || [null, event.data.from];
    const fromEmail = fromMatch[1] || event.data.from;
    const fromNameMatch = event.data.from.match(/^([^<]+)</);
    const fromName = fromNameMatch ? fromNameMatch[1].trim() : null;

    // Insert email into database
    const { data: emailRecord, error } = await supabaseAdmin
      .from('received_emails')
      .insert({
        resend_email_id: event.data.email_id,
        from_email: fromEmail,
        from_name: fromName,
        to_emails: event.data.to,
        cc_emails: event.data.cc || [],
        bcc_emails: event.data.bcc || [],
        reply_to: event.data.reply_to,
        subject: event.data.subject,
        message_id: event.data.message_id,
        html_body: event.data.html,
        text_body: event.data.text,
        attachments: event.data.attachments || [],
        headers: event.data.headers || {},
        spam_score: event.data.spam_score,
        received_at: event.data.created_at,
        read: false,
        flagged: false,
        archived: false,
        deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[Resend Webhook] Database error:', error);
      
      // If duplicate, that's okay - just acknowledge
      if (error.code === '23505') {
        console.log('[Resend Webhook] Email already exists:', event.data.email_id);
        return res.status(200).json({ message: 'Email already processed' });
      }
      
      throw error;
    }

    console.log('[Resend Webhook] Email saved to database:', emailRecord.id);

    // TODO: Optional - Send notification to admin about new email
    // You could trigger a push notification or update a real-time UI

    return res.status(200).json({
      success: true,
      id: emailRecord.id,
      message: 'Email received and stored',
    });

  } catch (error: any) {
    console.error('[Resend Webhook] Error processing email:', error);
    
    return res.status(500).json({
      error: 'Failed to process email',
      details: error.message,
    });
  }
}


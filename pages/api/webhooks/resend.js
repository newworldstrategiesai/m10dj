/**
 * Unified Resend webhook: updates communication_log (and email_tracking for opens)
 * so Submission Details shows full history from Resend (delivered, opened, bounced, complained).
 *
 * In Resend Dashboard: add one webhook URL and subscribe to:
 *   email.sent, email.delivered, email.delivery_delayed, email.opened,
 *   email.bounced, email.complained, email.failed
 *
 * POST /api/webhooks/resend
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Use dedicated secret for this endpoint; Resend gives a different signing secret per webhook URL
const webhookSecret = process.env.RESEND_WEBHOOK_SECRET_UNIFIED || process.env.RESEND_WEBHOOK_SECRET;

function verifySignature(payload, signature) {
  if (!webhookSecret) {
    console.warn('[Resend webhook] RESEND_WEBHOOK_SECRET_UNIFIED (or RESEND_WEBHOOK_SECRET) not set, skipping verification');
    return true;
  }
  if (!signature) return false;
  try {
    const hash = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
    return hash === signature;
  } catch (e) {
    return false;
  }
}

const STATUS_MAP = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'pending',
  'email.opened': 'read',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.failed': 'failed',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const signature = req.headers['svix-signature'] || req.headers['x-resend-signature'] || '';

  if (webhookSecret && !verifySignature(rawBody, signature)) {
    console.error('[Resend webhook] Invalid signature');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let event;
  try {
    event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const eventType = event.type;
  const data = event.data || {};
  const emailId = data.email_id;
  const to = Array.isArray(data.to) ? data.to[0] : (data.to || '');
  const recipientEmail = typeof to === 'string' ? to : (to?.email || '');
  const createdAt = data.created_at || event.created_at || new Date().toISOString();

  if (!emailId) {
    console.warn('[Resend webhook] Missing email_id, ignoring', eventType);
    return res.status(200).json({ received: true, processed: false });
  }

  const supported = [
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.opened',
    'email.bounced',
    'email.complained',
    'email.failed',
  ];
  if (!supported.includes(eventType)) {
    return res.status(200).json({ received: true, processed: false });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const newStatus = STATUS_MAP[eventType];

  // Find communication_log row by Resend email_id (we store it in metadata when sending)
  const { data: rows, error: findError } = await supabase
    .from('communication_log')
    .select('id, status, metadata, contact_submission_id, sent_to')
    .eq('communication_type', 'email')
    .eq('direction', 'outbound')
    .contains('metadata', { email_id: emailId })
    .limit(1);

  if (findError) {
    console.error('[Resend webhook] Error finding communication_log:', findError);
    return res.status(500).json({ error: 'Database error' });
  }

  const logRow = rows && rows[0];
  const metadataUpdate = {
    ...(logRow?.metadata || {}),
    resend_events: [
      ...(Array.isArray(logRow?.metadata?.resend_events) ? logRow.metadata.resend_events : []),
      { type: eventType, at: createdAt, ...(data.bounce && { bounce: data.bounce }) },
    ],
  };
  if (eventType === 'email.delivered') metadataUpdate.delivered_at = createdAt;
  if (eventType === 'email.opened') metadataUpdate.opened_at = createdAt;
  if (eventType === 'email.bounced' && data.bounce) metadataUpdate.bounce = data.bounce;
  if (eventType === 'email.complained') metadataUpdate.complained_at = createdAt;

  if (logRow) {
    const updatePayload = {
      status: newStatus,
      metadata: metadataUpdate,
      updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await supabase
      .from('communication_log')
      .update(updatePayload)
      .eq('id', logRow.id);

    if (updateError) {
      console.error('[Resend webhook] Error updating communication_log:', updateError);
      return res.status(500).json({ error: 'Update failed' });
    }
    console.log(`[Resend webhook] Updated communication_log ${logRow.id} -> ${newStatus} (${eventType})`);
  }

  // For opens: also write to email_tracking (like resend-email-opened.js) so opens are visible
  if (eventType === 'email.opened' && recipientEmail) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, email_address, first_name, last_name')
      .eq('email_address', recipientEmail)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase.from('email_tracking').insert({
      email_id: emailId,
      recipient_email: recipientEmail,
      sender_email: data.from || '',
      subject: data.subject || '',
      event_type: 'opened',
      opened_at: createdAt,
      contact_id: contact?.id || null,
      metadata: { email_id: emailId, recipient: recipientEmail, contact_name: contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : null },
      created_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.warn('[Resend webhook] email_tracking insert:', error.message);
    });

    if (contact?.id) {
      await supabase
        .from('contacts')
        .update({
          last_email_opened_at: createdAt,
          last_email_opened_type: 'confirmation',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contact.id);
    }
  }

  return res.status(200).json({ received: true, processed: true, event: eventType, email_id: emailId });
}

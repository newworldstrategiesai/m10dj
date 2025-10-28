/**
 * Gmail Pub/Sub Webhook Endpoint
 * Receives real-time notifications when new emails arrive
 * Requires Gmail API push notifications setup with Google Cloud Pub/Sub
 */

const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Gmail sends a push notification via Pub/Sub
    const message = req.body.message;
    
    if (!message || !message.data) {
      console.log('⚠️ No message data in webhook');
      return res.status(400).json({ error: 'No message data' });
    }

    // Decode the Pub/Sub message
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const notification = JSON.parse(decodedData);

    console.log('📧 Gmail webhook notification:', notification);

    // The notification contains emailAddress and historyId
    // We need to fetch new messages since the last historyId
    
    const { emailAddress, historyId } = notification;

    if (!emailAddress || !historyId) {
      return res.status(400).json({ error: 'Invalid notification data' });
    }

    // Trigger a sync to fetch new messages
    // In production, you might want to use a queue for this
    await syncNewMessages(emailAddress, historyId);

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Error processing Gmail webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function syncNewMessages(emailAddress, historyId) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get OAuth tokens for this email address
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_oauth_tokens')
      .select('*')
      .eq('user_email', emailAddress)
      .single();

    if (tokenError || !tokenData) {
      console.error('❌ No tokens found for:', emailAddress);
      return;
    }

    // Check if token is expired and refresh if needed
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/auth/callback`
      );

      oauth2Client.setCredentials({
        refresh_token: tokenData.refresh_token
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      await supabase
        .from('email_oauth_tokens')
        .update({
          access_token: credentials.access_token,
          expires_at: new Date(credentials.expiry_date).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.id);

      tokenData.access_token = credentials.access_token;
    }

    // Initialize Gmail API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: tokenData.access_token
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get the last processed historyId from our database
    const { data: lastSync } = await supabase
      .from('email_sync_log')
      .select('completed_at')
      .eq('sync_status', 'success')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch history since last sync
    // This is more efficient than fetching all messages
    const response = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: historyId
    });

    const history = response.data.history || [];

    // Process new messages from history
    for (const record of history) {
      if (record.messagesAdded) {
        for (const added of record.messagesAdded) {
          await processNewMessage(gmail, supabase, added.message);
        }
      }
    }

    console.log('✅ Webhook sync complete');

  } catch (error) {
    console.error('❌ Error syncing new messages:', error);
  }
}

async function processNewMessage(gmail, supabase, message) {
  try {
    // Check if message already exists
    const { data: existingMessage } = await supabase
      .from('email_messages')
      .select('id')
      .eq('message_id', message.id)
      .single();

    if (existingMessage) {
      return; // Already processed
    }

    // Fetch full message details
    const fullMessage = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
      format: 'full'
    });

    const headers = fullMessage.data.payload.headers;
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : null;
    };

    const fromEmail = getHeader('From');
    const toEmail = getHeader('To');
    const subject = getHeader('Subject');
    const dateStr = getHeader('Date');
    const ccEmail = getHeader('Cc');
    const bccEmail = getHeader('Bcc');

    // Extract email address and name
    const extractEmail = (emailStr) => {
      if (!emailStr) return { email: null, name: null };
      const match = emailStr.match(/(.*?)\s*<(.+?)>/) || emailStr.match(/(.+)/);
      if (match) {
        if (match[2]) {
          return { email: match[2], name: match[1].trim() };
        } else {
          return { email: match[1].trim(), name: null };
        }
      }
      return { email: emailStr, name: null };
    };

    const from = extractEmail(fromEmail);
    const to = extractEmail(toEmail);

    // Get message body
    let bodyText = '';
    let bodyHtml = '';

    const getBody = (payload) => {
      if (payload.body && payload.body.data) {
        const text = Buffer.from(payload.body.data, 'base64').toString('utf-8');
        if (payload.mimeType === 'text/html') {
          bodyHtml = text;
        } else {
          bodyText = text;
        }
      }

      if (payload.parts) {
        for (const part of payload.parts) {
          getBody(part);
        }
      }
    };

    getBody(fullMessage.data.payload);

    // Check if this is a lead inquiry
    const isLeadInquiry = checkIfLeadInquiry(subject, bodyText);

    // Determine message type
    const labelIds = fullMessage.data.labelIds || [];
    const messageType = labelIds.includes('SENT') ? 'sent' : 'inbox';

    // Check for attachments
    const hasAttachments = fullMessage.data.payload.parts?.some(
      part => part.filename && part.body?.attachmentId
    ) || false;

    // Store message
    const { data: storedMessage, error: messageError } = await supabase
      .from('email_messages')
      .insert({
        message_id: message.id,
        thread_id: fullMessage.data.threadId,
        from_email: from.email,
        from_name: from.name,
        to_email: to.email,
        cc_email: ccEmail ? ccEmail.split(',').map(e => e.trim()) : null,
        bcc_email: bccEmail ? bccEmail.split(',').map(e => e.trim()) : null,
        subject: subject,
        body_text: bodyText,
        body_html: bodyHtml,
        message_type: messageType,
        timestamp: new Date(dateStr || Date.now()).toISOString(),
        is_lead_inquiry: isLeadInquiry,
        has_attachments: hasAttachments,
        labels: labelIds
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error storing message:', messageError);
      return;
    }

    console.log('✅ New email processed:', message.id);

    // If it's a lead inquiry from inbox, create or update contact
    if (isLeadInquiry && messageType === 'inbox' && from.email) {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('primary_email', from.email)
        .is('deleted_at', null)
        .single();

      if (!existingContact) {
        // Create new contact
        const nameParts = (from.name || from.email).split(' ');
        const firstName = nameParts[0] || 'Email';
        const lastName = nameParts.slice(1).join(' ') || 'Lead';

        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            first_name: firstName,
            last_name: lastName,
            primary_email: from.email,
            email_address: from.email,
            lead_source: 'Email',
            lead_status: 'New',
            lead_temperature: 'Warm',
            communication_preference: 'email',
            notes: `Email inquiry: ${subject}\n\n${bodyText.substring(0, 500)}`,
            last_contacted_date: new Date().toISOString(),
            last_contact_type: 'email'
          })
          .select()
          .single();

        if (!contactError && newContact) {
          // Link message to contact
          await supabase
            .from('email_messages')
            .update({ 
              contact_id: newContact.id,
              processed: true 
            })
            .eq('id', storedMessage.id);

          console.log('✅ Created contact from webhook email:', newContact.id);

          // Send admin notification
          await supabase.from('notification_log').insert({
            notification_type: 'email_lead',
            recipient: 'admin',
            subject: `New Email Lead: ${subject}`,
            body: `From: ${from.email}\n\n${bodyText.substring(0, 200)}`,
            status: 'sent',
            sent_at: new Date().toISOString()
          });
        }
      } else {
        // Link message to existing contact
        await supabase
          .from('email_messages')
          .update({ 
            contact_id: existingContact.id,
            processed: true 
          })
          .eq('id', storedMessage.id);
      }
    }

  } catch (error) {
    console.error('Error processing new message:', error);
  }
}

function checkIfLeadInquiry(subject, body) {
  if (!subject && !body) return false;
  
  const inquiryKeywords = [
    'book', 'booking', 'available', 'price', 'pricing', 'cost', 'quote',
    'wedding', 'event', 'party', 'dj', 'interested', 'inquiry', 'contact',
    'date', 'venue', 'information', 'info', 'details', 'packages',
    'hire', 'services', 'availability'
  ];

  const combinedText = `${subject || ''} ${body || ''}`.toLowerCase();
  return inquiryKeywords.some(keyword => combinedText.includes(keyword));
}


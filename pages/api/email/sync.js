/**
 * Email Sync API
 * Syncs emails from Gmail inbox
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get OAuth tokens from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_oauth_tokens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (tokenError || !tokenData) {
      return res.status(400).json({ 
        error: 'No email account connected. Please connect your Gmail account first.' 
      });
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      // Refresh the token
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/auth/callback`
      );

      oauth2Client.setCredentials({
        refresh_token: tokenData.refresh_token
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update tokens in database
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

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from('email_sync_log')
      .insert({
        sync_type: req.body.syncType || 'manual',
        sync_status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (syncLogError) {
      console.error('Error creating sync log:', syncLogError);
    }

    // Initialize Gmail API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: tokenData.access_token
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch recent messages (last 7 days)
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    const query = `after:${sevenDaysAgo}`;

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: req.body.maxMessages || 100
    });

    const messages = response.data.messages || [];
    let messagesSynced = 0;
    let leadsCreated = 0;

    // Process each message
    for (const message of messages) {
      try {
        // Check if message already exists
        const { data: existingMessage } = await supabase
          .from('email_messages')
          .select('id')
          .eq('message_id', message.id)
          .single();

        if (existingMessage) {
          continue; // Skip already synced messages
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

        // Determine message type (inbox or sent)
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
          continue;
        }

        messagesSynced++;

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

              leadsCreated++;
              console.log('✅ Created contact from email:', newContact.id);
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

      } catch (messageError) {
        console.error('Error processing message:', message.id, messageError);
      }
    }

    // Update sync log
    if (syncLog) {
      await supabase
        .from('email_sync_log')
        .update({
          sync_status: 'success',
          messages_synced: messagesSynced,
          leads_created: leadsCreated,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);
    }

    console.log(`✅ Email sync complete: ${messagesSynced} messages, ${leadsCreated} leads`);

    res.status(200).json({
      success: true,
      messagesSynced,
      leadsCreated
    });

  } catch (error) {
    console.error('❌ Error syncing emails:', error);
    
    // Update sync log with error
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: latestLog } = await supabase
      .from('email_sync_log')
      .select('id')
      .eq('sync_status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (latestLog) {
      await supabase
        .from('email_sync_log')
        .update({
          sync_status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', latestLog.id);
    }

    res.status(500).json({ 
      error: 'Email sync failed',
      message: error.message 
    });
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


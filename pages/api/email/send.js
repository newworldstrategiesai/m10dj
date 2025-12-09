/**
 * Send Email API
 * Sends emails via Gmail API
 */

const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, body, threadId, contactId } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get organization_id from contact if provided
    let organizationId = null;
    if (contactId || recordId) {
      const contactLookupId = contactId || recordId;
      const { data: contact } = await supabase
        .from('contacts')
        .select('organization_id')
        .eq('id', contactLookupId)
        .single();
      
      if (!contact?.organization_id) {
        // Try contact_submissions as fallback
        const { data: submission } = await supabase
          .from('contact_submissions')
          .select('organization_id')
          .eq('id', contactLookupId)
          .single();
        
        if (submission?.organization_id) {
          organizationId = submission.organization_id;
        }
      } else {
        organizationId = contact.organization_id;
      }
    }

    // Get OAuth tokens - filter by organization_id if available
    let tokenQuery = supabase
      .from('email_oauth_tokens')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by organization_id if we have it (prevents using wrong org's email account)
    if (organizationId) {
      tokenQuery = tokenQuery.eq('organization_id', organizationId);
    }
    
    const { data: tokenData, error: tokenError } = await tokenQuery
      .limit(1)
      .single();

    if (tokenError || !tokenData) {
      return res.status(400).json({ 
        error: 'No email account connected' 
      });
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

    // Get user's email address
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const fromEmail = profile.data.emailAddress;

    // Create email message in RFC 2822 format
    const messageParts = [
      `From: ${fromEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body
    ];

    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email
    const sendParams = {
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    };

    // If replying to a thread, add threadId
    if (threadId) {
      sendParams.requestBody.threadId = threadId;
    }

    const result = await gmail.users.messages.send(sendParams);

    console.log('✅ Email sent:', result.data.id);

    // Store sent message in database
    const { data: storedMessage } = await supabase
      .from('email_messages')
      .insert({
        message_id: result.data.id,
        thread_id: result.data.threadId,
        from_email: fromEmail,
        from_name: null,
        to_email: to,
        subject: subject,
        body_text: body.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
        body_html: body,
        message_type: 'sent',
        timestamp: new Date().toISOString(),
        contact_id: contactId || null,
        processed: true
      })
      .select()
      .single();

    res.status(200).json({
      success: true,
      messageId: result.data.id,
      threadId: result.data.threadId
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    // Sanitize error - don't expose internal details
    res.status(500).json({ 
      error: 'Failed to send email. Please try again or contact support.'
    });
  }
}


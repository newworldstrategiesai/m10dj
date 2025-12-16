import { google } from 'googleapis';
import crypto from 'crypto';

// Simple encryption/decryption functions (in production, use a proper encryption library)
function decrypt(encryptedText, key) {
  if (!encryptedText || !key) return null;
  
  try {
    const algorithm = 'aes-256-cbc';
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return null;
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Refresh Gmail access token using refresh token
 */
async function refreshAccessToken(refreshToken, encryptionKey) {
  try {
    const decryptedRefreshToken = decrypt(refreshToken, encryptionKey);
    if (!decryptedRefreshToken) {
      throw new Error('Failed to decrypt refresh token');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/gmail/callback`
    );

    oauth2Client.setCredentials({
      refresh_token: decryptedRefreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

/**
 * Send email via Gmail API
 */
export async function sendEmailViaGmail({
  organizationId,
  to,
  subject,
  htmlContent,
  textContent,
  fromEmail
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const encryptionKey = process.env.GMAIL_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get organization with Gmail tokens
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('gmail_access_token, gmail_refresh_token, gmail_token_expiry, gmail_email_address')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    throw new Error('Organization not found or Gmail not connected');
  }

  if (!org.gmail_access_token) {
    throw new Error('Gmail not connected for this organization');
  }

  // Check if token needs refresh
  let accessToken = decrypt(org.gmail_access_token, encryptionKey);
  const tokenExpiry = org.gmail_token_expiry ? new Date(org.gmail_token_expiry) : null;
  
  if (!accessToken) {
    throw new Error('Failed to decrypt access token');
  }

  // Refresh token if expired or expiring soon (within 5 minutes)
  if (tokenExpiry && (tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000)) {
    if (!org.gmail_refresh_token) {
      throw new Error('Refresh token not available. Please reconnect Gmail.');
    }

    try {
      const newCredentials = await refreshAccessToken(org.gmail_refresh_token, encryptionKey);
      accessToken = newCredentials.access_token;

      // Update stored token
      const encryptedNewToken = encrypt(newCredentials.access_token, encryptionKey);
      const newExpiry = newCredentials.expiry_date 
        ? new Date(newCredentials.expiry_date) 
        : new Date(Date.now() + 3600 * 1000);

      await supabase
        .from('organizations')
        .update({
          gmail_access_token: encryptedNewToken,
          gmail_token_expiry: newExpiry.toISOString()
        })
        .eq('id', organizationId);
    } catch (refreshError) {
      console.error('Error refreshing token:', refreshError);
      throw new Error('Failed to refresh access token. Please reconnect Gmail.');
    }
  }

  // Create Gmail API client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/gmail/callback`
  );

  oauth2Client.setCredentials({
    access_token: accessToken
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Create email message
  const from = fromEmail || org.gmail_email_address || 'noreply@gmail.com';
  
  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlContent || textContent
  ];

  const email = emailLines.join('\r\n').trim();
  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Send email
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail
    }
  });

  return {
    success: true,
    messageId: response.data.id,
    threadId: response.data.threadId
  };
}

/**
 * Encrypt text using AES-256-CBC
 */
function encrypt(text, key) {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}


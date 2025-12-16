import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/gmail/callback`
);

// Simple encryption/decryption functions (in production, use a proper encryption library)
function encrypt(text, key) {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText, key) {
  const algorithm = 'aes-256-cbc';
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error } = req.query;

  if (error) {
    // Redirect back to contacts page with error
    return res.redirect(`/admin/contacts?gmail_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect('/admin/contacts?gmail_error=missing_code_or_state');
  }

  const organizationId = state;

  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    return res.redirect('/admin/contacts?gmail_error=gmail_not_configured');
  }

  // Encryption key (in production, use a secure key from environment)
  const encryptionKey = process.env.GMAIL_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    oauth2Client.setCredentials(tokens);

    // Get user info to get email address
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    const emailAddress = userInfo.email;

    // Calculate token expiry
    const tokenExpiry = tokens.expiry_date 
      ? new Date(tokens.expiry_date) 
      : new Date(Date.now() + 3600 * 1000); // Default to 1 hour if not provided

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokens.access_token, encryptionKey);
    const encryptedRefreshToken = tokens.refresh_token 
      ? encrypt(tokens.refresh_token, encryptionKey) 
      : null;

    // Store tokens in database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        gmail_access_token: encryptedAccessToken,
        gmail_refresh_token: encryptedRefreshToken,
        gmail_token_expiry: tokenExpiry.toISOString(),
        gmail_email_address: emailAddress,
        gmail_connected_at: new Date().toISOString(),
        email_provider: 'gmail'
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error storing Gmail tokens:', updateError);
      return res.redirect('/admin/contacts?gmail_error=storage_failed');
    }

    return res.redirect('/admin/contacts?gmail_success=connected');
  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error);
    return res.redirect(`/admin/contacts?gmail_error=${encodeURIComponent(error.message)}`);
  }
}


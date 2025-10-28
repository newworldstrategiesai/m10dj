/**
 * Gmail OAuth Callback
 * Handles OAuth callback and stores tokens
 */

const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    console.error('❌ OAuth error:', error);
    return res.redirect('/admin/email?error=auth_failed');
  }

  if (!code) {
    return res.redirect('/admin/email?error=no_code');
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/auth/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user's email address
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const userEmail = userInfo.data.email;

    console.log('✅ OAuth tokens received for:', userEmail);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));

    // Store tokens in database
    const { error: dbError } = await supabase
      .from('email_oauth_tokens')
      .upsert({
        user_email: userEmail,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || 'Bearer',
        expires_at: expiresAt.toISOString(),
        scope: tokens.scope,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_email'
      });

    if (dbError) {
      console.error('❌ Error storing tokens:', dbError);
      return res.redirect('/admin/email?error=storage_failed');
    }

    console.log('✅ Tokens stored successfully');

    // Redirect to email integration page
    res.redirect('/admin/email?success=connected');
  } catch (error) {
    console.error('❌ Error in OAuth callback:', error);
    res.redirect('/admin/email?error=callback_failed');
  }
}


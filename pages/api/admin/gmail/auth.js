import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/gmail/callback`
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { organizationId } = req.query;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    return res.status(500).json({ 
      error: 'Gmail OAuth not configured. Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables.' 
    });
  }

  try {
    // Generate OAuth URL with organization ID in state
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: organizationId, // Pass organization ID in state
      include_granted_scopes: true
    });

    return res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error generating Gmail OAuth URL:', error);
    return res.status(500).json({ 
      error: 'Failed to generate OAuth URL',
      details: error.message 
    });
  }
}


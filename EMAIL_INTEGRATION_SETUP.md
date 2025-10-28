# Email Integration Setup Guide

Complete guide to setting up Gmail integration for scanning inbox, detecting leads, and sending/receiving emails.

## Features

- 📧 **Gmail OAuth Integration** - Secure connection to your Gmail account
- 📥 **Inbox Scanning** - Automatically scan for lead inquiries
- 🤖 **Lead Detection** - AI-powered detection of potential leads
- 📤 **Send Emails** - Send emails directly from the admin panel
- 🔄 **Two-Way Sync** - Receive and send emails seamlessly
- 👤 **Auto Contact Creation** - Automatically create contacts from email leads
- 🔔 **Real-time Notifications** - Optional Pub/Sub webhooks for instant updates

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Cloud Setup](#google-cloud-setup)
3. [Environment Variables](#environment-variables)
4. [Database Migration](#database-migration)
5. [Usage](#usage)
6. [Real-time Notifications (Optional)](#real-time-notifications-optional)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Google Cloud Platform account
- Gmail account (G Suite/Google Workspace supported)
- Node.js packages: `googleapis` (already included in package.json)
- Admin access to your Supabase database

---

## Google Cloud Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your **Project ID**

### Step 2: Enable Gmail API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (or Internal if using Google Workspace)
3. Fill in the application information:
   - **App name**: Your App Name (e.g., "M10DJ Admin")
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Add test users (your Gmail address)
6. Click **Save and Continue**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: Email Integration
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/email/auth/callback` (development)
     - `https://yourdomain.com/api/email/auth/callback` (production)
5. Click **Create**
6. Copy your **Client ID** and **Client Secret**

### Step 5: Publish OAuth App (Optional)

If you want to use this in production without the "unverified app" warning:

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Submit for Google verification (may take 1-2 weeks)

---

## Environment Variables

Add these to your `.env.local` file:

```bash
# Gmail OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your production URL

# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important**: Never commit your `.env.local` file to version control!

---

## Database Migration

Run the migration to create the necessary tables:

```bash
# If using Supabase CLI
supabase migration up

# Or manually run the SQL
# Execute: supabase/migrations/20250128000001_add_email_integration.sql
```

This creates the following tables:
- `email_messages` - Stores all email communications
- `email_attachments` - Stores email attachment metadata
- `email_sync_log` - Tracks sync operations
- `email_oauth_tokens` - Securely stores OAuth tokens

---

## Usage

### 1. Connect Gmail Account

1. Navigate to `/admin/email` in your admin panel
2. Click **Connect Gmail Account**
3. Sign in with your Gmail account
4. Grant the requested permissions
5. You'll be redirected back to the admin panel

### 2. Sync Emails

Once connected, you can:

- **Manual Sync**: Click the "Sync Now" button to fetch recent emails (last 7 days)
- **Automatic Lead Detection**: The system automatically identifies potential lead inquiries
- **Contact Creation**: Leads are automatically converted to contacts

### 3. Send Emails

Use the API to send emails:

```javascript
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'customer@example.com',
    subject: 'Re: Wedding DJ Services',
    body: '<p>Thank you for your inquiry...</p>',
    threadId: 'optional-thread-id-for-replies',
    contactId: 'optional-contact-uuid'
  })
});
```

### 4. View Email Messages

All synced emails appear in:
- The Email Integration dashboard (`/admin/email`)
- The Conversation Detail Modal (when viewing leads)
- Contact records (linked emails)

---

## Real-time Notifications (Optional)

For instant email notifications, set up Google Cloud Pub/Sub:

### Step 1: Enable Pub/Sub API

1. Go to Google Cloud Console
2. Enable **Cloud Pub/Sub API**

### Step 2: Create a Topic

```bash
gcloud pubsub topics create gmail-notifications
```

### Step 3: Create a Push Subscription

```bash
gcloud pubsub subscriptions create gmail-webhook \
  --topic=gmail-notifications \
  --push-endpoint=https://yourdomain.com/api/email/webhook
```

### Step 4: Set up Gmail Watch

After connecting your Gmail account, run this API call to enable push notifications:

```bash
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/watch" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topicName": "projects/YOUR_PROJECT_ID/topics/gmail-notifications",
    "labelIds": ["INBOX"]
  }'
```

**Note**: Gmail watch expires after 7 days. You'll need to renew it or set up a cron job to automatically renew.

---

## API Reference

### Authentication Endpoints

#### `GET /api/email/auth/google`
Initiates OAuth flow, redirects to Google sign-in.

#### `GET /api/email/auth/callback`
OAuth callback endpoint. Handles token exchange and storage.

**Query Parameters:**
- `code` - Authorization code from Google
- `error` - Error message if auth failed

### Email Operations

#### `POST /api/email/sync`
Syncs emails from Gmail inbox.

**Request Body:**
```json
{
  "syncType": "manual",
  "maxMessages": 100
}
```

**Response:**
```json
{
  "success": true,
  "messagesSynced": 45,
  "leadsCreated": 3
}
```

#### `POST /api/email/send`
Sends an email via Gmail.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "<p>HTML email body</p>",
  "threadId": "optional-thread-id",
  "contactId": "optional-contact-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "gmail-message-id",
  "threadId": "gmail-thread-id"
}
```

#### `POST /api/email/disconnect`
Disconnects Gmail account and removes OAuth tokens.

**Response:**
```json
{
  "success": true
}
```

#### `POST /api/email/webhook`
Webhook endpoint for Gmail push notifications (Pub/Sub).

**Request Body:** (from Google Pub/Sub)
```json
{
  "message": {
    "data": "base64-encoded-notification"
  }
}
```

---

## Lead Detection Keywords

The system automatically detects lead inquiries based on these keywords:

- book, booking, available, availability
- price, pricing, cost, quote
- wedding, event, party
- dj, interested, inquiry
- contact, information, info, details
- packages, hire, services

**Customization**: Edit the `checkIfLeadInquiry` function in:
- `/pages/api/email/sync.js`
- `/pages/api/email/webhook.js`

---

## Database Schema

### email_messages

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| message_id | TEXT | Gmail message ID (unique) |
| thread_id | TEXT | Gmail thread ID |
| from_email | TEXT | Sender email address |
| from_name | TEXT | Sender name |
| to_email | TEXT | Recipient email address |
| subject | TEXT | Email subject |
| body_text | TEXT | Plain text body |
| body_html | TEXT | HTML body |
| message_type | TEXT | 'inbox' or 'sent' |
| timestamp | TIMESTAMP | When email was sent/received |
| is_lead_inquiry | BOOLEAN | Auto-detected lead status |
| processed | BOOLEAN | Whether lead was processed |
| contact_id | UUID | Linked contact (if created) |
| has_attachments | BOOLEAN | Has attachments flag |
| labels | TEXT[] | Gmail labels |

### email_oauth_tokens

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_email | TEXT | Gmail account email (unique) |
| access_token | TEXT | OAuth access token |
| refresh_token | TEXT | OAuth refresh token |
| expires_at | TIMESTAMP | Token expiration time |

**Security**: RLS policies ensure only admin users can access tokens.

---

## Troubleshooting

### "Gmail account not connected" error

**Solution:**
1. Check that OAuth tokens exist in `email_oauth_tokens` table
2. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
3. Try disconnecting and reconnecting

### "Failed to sync emails" error

**Possible causes:**
1. **Token expired**: The system auto-refreshes, but check `expires_at` in database
2. **API quota exceeded**: Check Google Cloud Console quotas
3. **Missing permissions**: Verify all OAuth scopes are granted

### "Unverified app" warning during OAuth

**This is normal during development:**
- Click "Advanced" → "Go to [App Name] (unsafe)" to proceed
- For production, submit your app for Google verification

### Sync not finding emails

**Check:**
1. Date range: Default is last 7 days
2. Email labels: Ensure emails are in INBOX
3. Lead detection keywords: May need to customize
4. Check sync logs in `email_sync_log` table

### No leads being created

**Verify:**
1. Lead detection keywords match your emails
2. Check `is_lead_inquiry` flag in `email_messages` table
3. Verify contact creation permissions (RLS policies)
4. Look for errors in `email_sync_log.error_message`

---

## Security Best Practices

1. **Never commit credentials**: Keep `.env.local` in `.gitignore`
2. **Rotate tokens**: Periodically disconnect and reconnect
3. **Limit access**: Only give OAuth access to necessary email accounts
4. **Monitor usage**: Check sync logs regularly
5. **Use HTTPS**: Always use HTTPS in production
6. **RLS policies**: Ensure database RLS is enabled and configured

---

## Scheduled Sync (Optional)

To automatically sync emails every hour, set up a cron job:

### Using Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/email/sync",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Using External Cron Services

Use services like:
- [EasyCron](https://www.easycron.com/)
- [Cron-job.org](https://cron-job.org/)
- GitHub Actions

Hit: `POST https://yourdomain.com/api/email/sync`

---

## Next Steps

1. ✅ Complete Google Cloud setup
2. ✅ Add environment variables
3. ✅ Run database migration
4. ✅ Connect Gmail account in admin panel
5. ✅ Test sync functionality
6. ⬜ (Optional) Set up Pub/Sub for real-time notifications
7. ⬜ (Optional) Configure scheduled sync

---

## Support

For issues or questions:
- Check troubleshooting section above
- Review Google Cloud Console logs
- Check Supabase database logs
- Verify environment variables are set correctly

---

## Advanced: Custom Email Templates

To create custom email templates for sending:

1. Create a templates folder: `/email-templates/`
2. Add HTML templates
3. Modify `/pages/api/email/send.js` to load templates
4. Use variables like `{{name}}`, `{{eventDate}}`, etc.

Example:

```javascript
// In /pages/api/email/send.js
const template = fs.readFileSync('./email-templates/inquiry-response.html', 'utf8');
const body = template
  .replace('{{name}}', contact.first_name)
  .replace('{{eventDate}}', contact.event_date);
```

---

## License

This email integration is part of the M10DJ project and follows the same license.

---

**Last Updated:** January 28, 2025
**Version:** 1.0.0


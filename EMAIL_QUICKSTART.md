# Email Integration - Quick Start Guide

Get your email integration up and running in 15 minutes!

## 🚀 Quick Setup (5 Steps)

### Step 1: Google Cloud Setup (5 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Gmail API**
4. Configure **OAuth consent screen**:
   - Choose External
   - Add your email as test user
5. Create **OAuth 2.0 Credentials**:
   - Type: Web application
   - Redirect URI: `http://localhost:3000/api/email/auth/callback`

### Step 2: Environment Variables (1 min)

Add to your `.env.local`:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 3: Database Migration (1 min)

Run the migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually execute the SQL file in Supabase dashboard:
# supabase/migrations/20250128000001_add_email_integration.sql
```

### Step 4: Install Dependencies (1 min)

```bash
npm install googleapis
```

### Step 5: Connect & Test (2 min)

1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/admin/email`
3. Click **Connect Gmail Account**
4. Authorize the app
5. Click **Sync Now** to test

## ✅ You're Done!

Your email integration is now active and scanning for leads.

## 📚 What's Included

### Database Tables Created
- ✅ `email_messages` - All emails (inbox & sent)
- ✅ `email_attachments` - Attachment metadata
- ✅ `email_sync_log` - Sync history
- ✅ `email_oauth_tokens` - Secure OAuth tokens

### API Endpoints Created
- ✅ `GET /api/email/auth/google` - OAuth flow
- ✅ `GET /api/email/auth/callback` - OAuth callback
- ✅ `POST /api/email/sync` - Sync emails
- ✅ `POST /api/email/send` - Send emails
- ✅ `POST /api/email/webhook` - Real-time notifications
- ✅ `POST /api/email/disconnect` - Disconnect account

### Frontend Components Created
- ✅ `/admin/email` - Email integration dashboard
- ✅ `EmailIntegration` component - Full UI
- ✅ `ConversationDetailModal` - Email support

## 🎯 Key Features

### Automatic Lead Detection
Emails are automatically scanned for these keywords:
- book, booking, available, availability
- price, pricing, cost, quote
- wedding, event, party, dj
- interested, inquiry, contact
- information, details, packages

### Auto Contact Creation
When a lead email is detected:
1. ✅ Contact is automatically created
2. ✅ Email is linked to contact
3. ✅ Event details are extracted (date, venue, guest count)
4. ✅ Admin notification is sent

### Two-Way Communication
- ✅ Scan inbox for incoming emails
- ✅ Send emails from admin panel
- ✅ Reply to email threads
- ✅ Track all communications

## 🔧 Common Tasks

### Manual Sync
```javascript
// In your code
await fetch('/api/email/sync', {
  method: 'POST',
  body: JSON.stringify({ syncType: 'manual', maxMessages: 100 })
});
```

### Send Email
```javascript
await fetch('/api/email/send', {
  method: 'POST',
  body: JSON.stringify({
    to: 'customer@example.com',
    subject: 'Re: Your Inquiry',
    body: '<p>Thank you for reaching out...</p>',
    contactId: 'uuid-of-contact'
  })
});
```

### Disconnect Account
```javascript
await fetch('/api/email/disconnect', {
  method: 'POST'
});
```

## 📊 Monitoring

### Check Sync Status
View sync logs in Supabase:
```sql
SELECT * FROM email_sync_log ORDER BY started_at DESC LIMIT 10;
```

### View Recent Emails
```sql
SELECT 
  from_email,
  subject,
  is_lead_inquiry,
  processed,
  timestamp
FROM email_messages 
ORDER BY timestamp DESC 
LIMIT 20;
```

### Lead Conversion Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE is_lead_inquiry = true) as total_leads,
  COUNT(*) FILTER (WHERE contact_id IS NOT NULL) as converted_leads,
  ROUND(
    COUNT(*) FILTER (WHERE contact_id IS NOT NULL)::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE is_lead_inquiry = true), 0) * 100, 
    2
  ) as conversion_rate
FROM email_messages;
```

## ⚠️ Troubleshooting

### "Not connected" status
- Check environment variables are set
- Try reconnecting via `/admin/email`
- Check OAuth tokens in database

### No emails syncing
- Default sync window is last 7 days
- Check Gmail labels (must be in INBOX)
- Verify lead detection keywords

### "Unverified app" warning
- Normal during development
- Click "Advanced" → "Continue"
- For production, submit for Google verification

## 🎓 Next Steps

### Optional: Real-time Notifications
Set up Pub/Sub webhooks for instant email notifications.
See: `EMAIL_INTEGRATION_SETUP.md` → Real-time Notifications

### Optional: Scheduled Sync
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

### Optional: Custom Email Templates
Create HTML templates for professional email responses.
See: `EMAIL_INTEGRATION_SETUP.md` → Advanced Section

## 📖 Full Documentation

For detailed setup, troubleshooting, and advanced features:
- Read: `EMAIL_INTEGRATION_SETUP.md`
- Google Cloud: [Gmail API Docs](https://developers.google.com/gmail/api)
- OAuth Setup: [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)

## 🆘 Support

Issues? Check these first:
1. Environment variables set correctly
2. Database migration completed
3. OAuth redirect URIs match exactly
4. Gmail API enabled in Google Cloud
5. Check browser console for errors

---

**🎉 Happy emailing! Your leads are now automatically tracked.**


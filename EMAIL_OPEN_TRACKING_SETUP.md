# Email Open Tracking Setup Guide

## Overview

This system tracks when clients open the confirmation email sent after form submission. It uses Resend's webhook system to receive email open events.

## How It Works

1. **Client submits form** → Confirmation email is sent
2. **Email sent** → Tracking record created in `email_tracking` table
3. **Client opens email** → Resend sends webhook to `/api/webhooks/resend-email-opened`
4. **Webhook received** → Updates `email_tracking` table and `contacts.last_email_opened_at`

## Setup Instructions

### Step 1: Configure Resend Webhook

1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to **Webhooks** → **Add Webhook**
3. Configure the webhook:
   - **Endpoint URL**: `https://yourdomain.com/api/webhooks/resend-email-opened`
   - **Events to listen for**: Select `email.opened` (and optionally `email.delivered`, `email.clicked`, `email.bounced`)
   - **Description**: "Track client email opens"

4. Copy the **Signing Secret** (you'll need this for verification)

### Step 2: Add Webhook Secret to Environment Variables

Add to your `.env.local` or production environment:

```env
RESEND_WEBHOOK_SECRET=your_webhook_signing_secret_here
```

### Step 3: Run Database Migration

The migration creates the `email_tracking` table:

```bash
# If using Supabase CLI
supabase migration up

# Or apply manually in Supabase Dashboard
# SQL file: supabase/migrations/20250130000001_create_email_tracking_table.sql
```

### Step 4: Verify Webhook is Working

1. Submit a test contact form
2. Check the email tracking record was created:
   ```sql
   SELECT * FROM email_tracking 
   WHERE event_type = 'sent' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

3. Open the confirmation email
4. Check the webhook received the open event:
   ```sql
   SELECT * FROM email_tracking 
   WHERE event_type = 'opened' 
   ORDER BY opened_at DESC 
   LIMIT 1;
   ```

5. Check the contact was updated:
   ```sql
   SELECT id, email_address, last_email_opened_at 
   FROM contacts 
   WHERE last_email_opened_at IS NOT NULL 
   ORDER BY last_email_opened_at DESC 
   LIMIT 1;
   ```

## Database Schema

### `email_tracking` Table

- `id` - UUID primary key
- `email_id` - Resend email ID
- `recipient_email` - Client's email address
- `sender_email` - Sender email (hello@m10djcompany.com)
- `subject` - Email subject
- `event_type` - 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained'
- `opened_at` - Timestamp when email was opened
- `clicked_at` - Timestamp when link was clicked
- `contact_id` - Foreign key to contacts table
- `metadata` - JSONB with additional data
- `created_at` - Record creation timestamp

### `contacts` Table Updates

When an email is opened, the contact record is updated with:
- `last_email_opened_at` - Timestamp of last email open
- `last_email_opened_type` - Type of email ('confirmation', etc.)

## Viewing Email Open Data

### In Admin Dashboard

You can query email opens for a specific contact:

```sql
SELECT 
  et.*,
  c.first_name,
  c.last_name
FROM email_tracking et
JOIN contacts c ON et.contact_id = c.id
WHERE et.contact_id = 'contact-uuid-here'
ORDER BY et.created_at DESC;
```

### Email Open Rate

```sql
SELECT 
  COUNT(*) FILTER (WHERE event_type = 'sent') as emails_sent,
  COUNT(*) FILTER (WHERE event_type = 'opened') as emails_opened,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'opened')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'sent'), 0) * 100, 
    2
  ) as open_rate_percent
FROM email_tracking
WHERE created_at >= NOW() - INTERVAL '30 days';
```

## Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook URL is correct** - Must be publicly accessible
2. **Verify webhook is enabled** in Resend dashboard
3. **Check server logs** for webhook requests
4. **Test webhook manually** using Resend's webhook test feature

### Email Opens Not Being Tracked

1. **Check email_tracking table exists** - Run migration if needed
2. **Verify webhook endpoint is accessible** - Test with curl:
   ```bash
   curl -X POST https://yourdomain.com/api/webhooks/resend-email-opened \
     -H "Content-Type: application/json" \
     -d '{"type":"email.opened","data":{"email_id":"test","to":["test@example.com"]}}'
   ```

3. **Check Resend webhook logs** - View in Resend dashboard
4. **Verify contact_id exists** - Email tracking links to contacts table

### Email Tracking Records Not Created

1. **Check RESEND_API_KEY is set** - Required for sending emails
2. **Verify contact record exists** - Email tracking requires contact_id
3. **Check server logs** - Look for tracking errors

## Security Notes

- Webhook endpoint should verify Resend's webhook signature (future enhancement)
- Email tracking data is stored securely in Supabase
- Only authorized admins can view email tracking data

## Future Enhancements

- [ ] Add webhook signature verification
- [ ] Track email clicks (links clicked)
- [ ] Email bounce tracking
- [ ] Unsubscribe tracking
- [ ] Email engagement scoring
- [ ] Admin dashboard view for email opens


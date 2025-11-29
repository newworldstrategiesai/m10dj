# Email Forwarding Setup Guide

This guide will help you set up email forwarding so that admins can forward email threads directly to a special email address, and the system will automatically parse and update contact records.

## How It Works

1. Admin forwards an email thread to a special email address (e.g., `import@m10djcompany.com`)
2. Resend receives the email and sends a webhook to your application
3. The application:
   - Identifies the contact by the sender's email address
   - Parses the email content for playlists, event times, special requests, etc.
   - Updates the contact record and questionnaire data automatically

## Setup Steps

### Step 1: Configure Resend Inbound Email

1. **Log in to Resend Dashboard**
   - Go to [https://resend.com/dashboard](https://resend.com/dashboard)
   - Navigate to **Domains** → Select your domain (e.g., `m10djcompany.com`)

2. **Set Up Inbound Email**
   - Go to **Inbound** section
   - Click **Add Inbound Domain** or configure existing domain
   - Add MX records to your DNS (Resend will provide these)
   - Set up a subdomain or use your main domain

3. **Create Inbound Route**
   - Create a route for `import@m10djcompany.com` (or your preferred address)
   - Set the webhook URL to: `https://yourdomain.com/api/email/inbound-webhook`
   - Enable the route

### Step 2: Configure Environment Variables

Add the following to your `.env.local` and production environment:

```bash
# Resend Webhook Secret (optional but recommended for security)
RESEND_WEBHOOK_SECRET=your-webhook-secret-here
```

**To get the webhook secret:**
1. In Resend Dashboard, go to **API Keys** → **Webhooks**
2. Create a new webhook or view existing one
3. Copy the webhook secret

### Step 3: Test the Setup

1. **Send a test email:**
   - Forward an email thread from a contact to `import@m10djcompany.com`
   - The email should contain:
     - Spotify playlist links
     - Event times (ceremony, grand entrance, grand exit)
     - Special requests

2. **Check the logs:**
   - Look for webhook calls in your application logs
   - Check Resend Dashboard → **Logs** for email delivery status
   - Verify the contact was updated in your database

3. **Verify updates:**
   - Go to the contact's page in your admin panel
   - Check that playlists, event times, and special requests were updated

## What Gets Extracted

The system automatically extracts:

### From Email Content:
- **Spotify Playlists:**
  - First dance playlist
  - Wedding/reception playlist
  - Cocktail hour playlist

- **Event Times:**
  - Ceremony start time
  - Ceremony end time
  - Grand entrance time
  - Grand exit time

- **Special Requests:**
  - Mariachi band information
  - Break schedules
  - Other special notes

- **General Notes:**
  - Schedule questions
  - Setup/breakdown questions
  - Any other relevant information

## Security Considerations

1. **Webhook Signature Verification:**
   - The webhook endpoint verifies the signature from Resend
   - Set `RESEND_WEBHOOK_SECRET` for production use
   - Without the secret, verification is skipped (development only)

2. **Contact Matching:**
   - Only emails from known contacts (matching email address) are processed
   - Unknown senders will be logged but not processed
   - This prevents unauthorized updates

3. **Rate Limiting:**
   - Consider adding rate limiting to the webhook endpoint
   - Monitor for suspicious activity

## Troubleshooting

### Email Not Being Processed

1. **Check Resend Dashboard:**
   - Verify the email was received
   - Check webhook delivery status
   - Look for error messages

2. **Check Application Logs:**
   - Look for webhook calls in your server logs
   - Check for error messages

3. **Verify Contact Exists:**
   - The sender's email must match an existing contact's email address
   - Check the contact database to confirm

### Contact Not Found

- The system only processes emails from existing contacts
- If a contact doesn't exist, create them first or use the manual import widget
- The webhook will return a success response but won't update anything

### Parsing Issues

- The parser looks for specific patterns in the email content
- Make sure the email contains clear information (playlists, times, etc.)
- Check the extracted data in the webhook response logs

## Alternative: Manual Import

If email forwarding isn't working or you prefer manual control:
- Use the "Import Conversation" widget in the admin panel
- Paste the email content directly
- Review and edit extracted information before importing

## Support

For issues or questions:
- Check Resend documentation: [https://resend.com/docs](https://resend.com/docs)
- Review application logs for detailed error messages
- Contact support if webhook isn't being called


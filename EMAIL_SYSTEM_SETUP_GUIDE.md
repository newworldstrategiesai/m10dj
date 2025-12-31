# Custom Email System Setup Guide

**Status:** ✅ Implementation Complete  
**Date:** February 17, 2025

---

## ✅ What's Been Built

1. **Database Migration** - Email storage tables with RLS policies
2. **EmailAssistant Class** - Core email functionality for voice agents
3. **Email Tools** - 5 tools for agent function calling
4. **Webhook Handler** - Receives incoming emails
5. **Inbox Management API** - Create/manage email inboxes
6. **Agent Integration** - EmailAssistant integrated with LiveKit agent

---

## 🚀 Quick Start

### Step 1: Run Database Migration

```bash
# Apply the migration
npx supabase migration up

# Or if using local Supabase
npx supabase db push
```

This creates:
- `email_inboxes` - Inbox management
- `emails` - Email storage
- `email_attachments` - Attachment storage
- `email_conversations` - Email-voice conversation linking

### Step 2: Verify Environment Variables

Make sure these are set in `.env.local`:

```bash
# Required
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional (for webhook security)
RESEND_WEBHOOK_SECRET=your_webhook_secret
```

### Step 3: Set Up Email Receiving

**Option A: Email Forwarding (Recommended)**

1. Set up email forwarding in your email provider:
   - Forward `assistant@m10djcompany.com` → Webhook URL
   - Or use catch-all forwarding

2. Configure forwarding to POST to:
   ```
   https://yourdomain.com/api/email/webhook/resend
   ```

**Option B: Resend Webhooks (If Supported)**

1. Go to Resend Dashboard → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/email/webhook/resend`
3. Select events: `email.received` (if available)

**Option C: IMAP Polling (Fallback)**

If webhooks aren't available, you can implement IMAP polling:
- Poll email account every 30-60 seconds
- POST new emails to webhook endpoint

### Step 4: Create an Inbox

```bash
# Via API
curl -X POST http://localhost:3000/api/email/inbox \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "organizationId": "your-org-id",
    "emailAddress": "assistant@m10djcompany.com",
    "productId": "m10dj",
    "displayName": "Voice Assistant Inbox"
  }'
```

Or create directly in database:
```sql
INSERT INTO email_inboxes (
  organization_id,
  email_address,
  product_id,
  display_name,
  is_active
) VALUES (
  'your-org-id',
  'assistant@m10djcompany.com',
  'm10dj',
  'Voice Assistant Inbox',
  true
);
```

### Step 5: Test Email Sending

Start your agent server:
```bash
npm run agent:dev
```

The agent now has email capabilities! Test by:
1. Starting a voice session
2. Saying: "Send an email to test@example.com"
3. Agent will use the `send_email` tool

---

## 🧪 Testing

### Test 1: Email Sending

1. Start agent: `npm run agent:dev`
2. Connect to LiveKit room
3. Say: "Send an email to john@example.com with subject 'Test' and body 'This is a test'"
4. Verify email sent via Resend
5. Check Supabase `emails` table

### Test 2: Email Receiving

1. Send email to your inbox address (e.g., `assistant@m10djcompany.com`)
2. Email should be forwarded to webhook
3. Check Supabase `emails` table for new entry
4. Verify real-time notification (check Supabase Realtime)

### Test 3: Email Reading

1. Start voice session
2. Say: "Read my emails"
3. Agent should use `read_emails` tool
4. Agent should read out email summaries

### Test 4: Email Search

1. Start voice session
2. Say: "Search for emails about wedding"
3. Agent should use `search_emails` tool
4. Agent should return matching emails

---

## 📋 Available Email Tools

The agent now has 5 email tools:

1. **send_email** - Send emails
   - "Send an email to john@example.com"
   - "Email Sarah about the event"

2. **read_emails** - Read recent emails
   - "Read my emails"
   - "Show me unread emails"

3. **search_emails** - Search emails
   - "Find emails about wedding"
   - "Search for messages from John"

4. **get_email** - Get email details
   - "Read email ID abc123"
   - "Show me the full email"

5. **mark_email_read** - Mark as read
   - Automatically called when reading emails

---

## 🔧 Configuration

### Email Address Strategy

You can use different strategies:

1. **Single Inbox**: `assistant@m10djcompany.com`
   - All agents use same inbox
   - Simple but less isolation

2. **Per-Organization**: `assistant-{org-id}@m10djcompany.com`
   - Each organization has own inbox
   - Better isolation

3. **Per-Contact**: `contact-{contact-id}@m10djcompany.com`
   - Each contact has own inbox
   - Maximum isolation

### Product Isolation

Always set `product_id` when creating inboxes:
- `'m10dj'` - M10DJ Company
- `'djdash'` - DJDash.net
- `'tipjar'` - TipJar.live

This ensures cross-product data isolation.

---

## 🐛 Troubleshooting

### Emails Not Sending

1. Check `RESEND_API_KEY` is set
2. Verify Resend account is active
3. Check Resend dashboard for errors
4. Verify custom domain is verified in Resend

### Emails Not Receiving

1. Check webhook endpoint is accessible
2. Verify email forwarding is configured
3. Check webhook logs for errors
4. Verify inbox exists in database

### Real-Time Notifications Not Working

1. Check Supabase Realtime is enabled
2. Verify channel subscription in EmailAssistant
3. Check browser console for errors
4. Verify organization_id matches

### Agent Not Using Email Tools

1. Check EmailAssistant initialized successfully
2. Verify organization_id is set in agent metadata
3. Check agent logs for errors
4. Verify tools are added to agent

---

## 📊 Monitoring

### Check Email Status

```sql
-- Count emails by inbox
SELECT 
  inbox_email,
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE is_read = false) as unread,
  MAX(received_at) as last_email
FROM emails
GROUP BY inbox_email;

-- Recent emails
SELECT 
  from_address,
  subject,
  received_at,
  is_read
FROM emails
ORDER BY received_at DESC
LIMIT 10;
```

### Check Inbox Status

```sql
SELECT 
  email_address,
  organization_id,
  product_id,
  is_active,
  created_at
FROM email_inboxes
WHERE is_active = true;
```

---

## 🔐 Security Notes

1. **Webhook Security**: Implement proper signature verification
2. **RLS Policies**: Already configured, but review for your use case
3. **API Keys**: Never commit to repository
4. **Email Content**: Consider encrypting sensitive emails
5. **Rate Limiting**: Implement rate limiting on webhook endpoint

---

## 📚 Next Steps

1. **Set up email forwarding** for receiving emails
2. **Create inboxes** for your organizations
3. **Test email sending** via voice agent
4. **Test email receiving** via webhook
5. **Monitor** email activity

---

## 🎯 Usage Examples

### Voice Commands

- "Send an email to john@example.com saying we're confirmed for Saturday"
- "Read my latest emails"
- "Search for emails about the wedding"
- "What emails do I have from Sarah?"
- "Mark all emails as read"

### Programmatic Usage

```typescript
import { EmailAssistant } from '@/lib/email/email-assistant';

const assistant = new EmailAssistant({
  organizationId: 'org-123',
  productId: 'm10dj',
  emailAddress: 'assistant@m10djcompany.com',
});

await assistant.initialize();

// Send email
await assistant.sendEmail({
  to: 'customer@example.com',
  subject: 'Event Confirmation',
  body: 'Your event is confirmed!',
});

// Read emails
const emails = await assistant.readEmails(10, true); // 10 unread emails
```

---

## ✅ Checklist

- [ ] Database migration applied
- [ ] Environment variables set
- [ ] Email forwarding/webhook configured
- [ ] Inbox created in database
- [ ] Agent server tested
- [ ] Email sending tested
- [ ] Email receiving tested
- [ ] Real-time notifications working
- [ ] RLS policies verified
- [ ] Security review completed

---

**Ready to use!** Your voice agents now have full email capabilities using your existing Resend infrastructure.


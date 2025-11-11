# Email Receiving Setup Guide

Complete guide to receive emails at `hello@m10djcompany.com` and view them in your admin UI.

## ✅ Prerequisites

- [x] Domain `m10djcompany.com` already verified in Resend for sending
- [x] Webhook endpoint created: `/api/webhooks/resend-email-received`
- [x] Database table `received_emails` ready to use
- [x] Email client UI at `/admin/email-client`

## 📋 Setup Steps

### Step 1: Enable Receiving in Resend

1. **Go to Resend Domains**
   - Visit: https://resend.com/domains
   - Find your domain: `m10djcompany.com`
   - Click on it to view details

2. **Enable Receiving**
   - Look for the "Receiving" section
   - Click the toggle to enable receiving
   - A modal will appear with MX record details

3. **Copy the MX Record**
   ```
   Type: MX
   Name: @ (or m10djcompany.com)
   Value: inbound-smtp.resend.com
   Priority: 10
   ```

### Step 2: Add MX Record to Namecheap

⚠️ **IMPORTANT**: Since you already use `m10djcompany.com` for email (Gmail), adding an MX record would conflict. You have 2 options:

#### Option A: Use Email Forwarding (Recommended - Easiest)

**This lets you keep your Gmail inbox AND receive in the UI**

1. In Gmail:
   - Go to Settings → Forwarding and POP/IMAP
   - Add a forwarding address: `hello@inbound.m10djcompany.com` (the subdomain you'll create)
   - Confirm the forwarding

2. In Namecheap:
   - Advanced DNS
   - Add MX record for subdomain:
     ```
     Type: MX
     Host: inbound
     Value: inbound-smtp.resend.com
     Priority: 10
     ```

3. In Resend:
   - When setting up receiving, use: `inbound.m10djcompany.com`
   - Emails to `anything@inbound.m10djcompany.com` will go to your UI

#### Option B: Use Subdomain Only (Separate Inbox)

**This creates a completely separate inbox**

1. In Namecheap:
   - Advanced DNS
   - Add MX record for subdomain:
     ```
     Type: MX
     Host: inbox
     Value: inbound-smtp.resend.com
     Priority: 10
     ```

2. In Resend:
   - When setting up receiving, use domain: `inbox.m10djcompany.com`
   - You'll receive emails at: `hello@inbox.m10djcompany.com`

### Step 3: Configure Webhook in Resend

1. **Go to Webhooks**
   - Visit: https://resend.com/webhooks
   - Click "Add Webhook"

2. **Enter Webhook Details**
   ```
   Endpoint URL: https://m10djcompany.com/api/webhooks/resend-email-received
   Events: ✓ email.received
   Description: Store received emails in database
   ```

3. **Save Webhook**
   - Copy the webhook signing secret (optional - for verification)
   - Store in `.env.local` as `RESEND_WEBHOOK_SECRET`

### Step 4: Verify MX Record

1. **In Resend**
   - After adding MX record to Namecheap
   - Go back to your domain in Resend
   - Click "I've added the record"
   - Wait for verification (can take up to 48 hours, usually ~10 minutes)

2. **Check Status**
   - MX record should show as "Verified" in green
   - If not verified after 1 hour, check:
     - DNS propagation: https://dnschecker.org
     - Namecheap DNS settings
     - MX record priority (must be lowest priority)

### Step 5: Run Database Migration

```bash
# Apply the migration to create received_emails table
npx supabase migration up
```

Or manually run the SQL in Supabase SQL Editor:
- File: `supabase/migrations/20250211000000_create_emails_table.sql`

### Step 6: Test Email Receiving

1. **Send Test Email**
   - From your personal email
   - To: `hello@inbound.m10djcompany.com` (or your chosen address)
   - Subject: "Test - Email Receiving"
   - Body: "Testing the new email receiving system"

2. **Check Webhook Logs**
   - Resend → Webhooks → Click your webhook
   - Should see a successful delivery (200 status)

3. **Check Database**
   ```sql
   SELECT * FROM received_emails ORDER BY received_at DESC LIMIT 1;
   ```

4. **Check UI**
   - Go to: https://m10djcompany.com/admin/email-client
   - You should see your test email

## 🔧 Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook is active** in Resend dashboard
2. **Test webhook endpoint** manually:
   ```bash
   curl -X POST https://m10djcompany.com/api/webhooks/resend-email-received \
     -H "Content-Type: application/json" \
     -d '{"type":"email.received","created_at":"2024-01-01T00:00:00Z","data":{"email_id":"test","created_at":"2024-01-01T00:00:00Z","from":"test@example.com","to":["hello@inbound.m10djcompany.com"],"subject":"Test","message_id":"<test>","attachments":[]}}'
   ```
3. **Check server logs** in Vercel

### MX Record Not Verifying

1. **DNS Propagation**: Wait longer (up to 48 hours)
2. **Check DNS**: Use https://dnschecker.org
3. **Priority**: Ensure MX priority is lower than existing records
4. **Subdomain**: Consider using a subdomain if conflicts exist

### Emails Not Appearing in UI

1. **Check database**: Verify emails are being saved
2. **Check RLS policies**: Ensure your user has admin role
3. **Check API endpoint**: Test `/api/emails` directly
4. **Clear cache**: Hard refresh the UI

## 📧 Email Addresses You Can Use

After setup, you can receive emails at:

```
hello@inbound.m10djcompany.com
support@inbound.m10djcompany.com
contact@inbound.m10djcompany.com
info@inbound.m10djcompany.com
*@inbound.m10djcompany.com  (catch-all)
```

All will be caught by the webhook and stored in your database!

## 🔐 Security Notes

1. **Webhook Verification**: Add signature verification to prevent fake webhooks
2. **Admin Only**: Only admin users can view emails (RLS policies)
3. **Spam Filtering**: Resend provides spam_score in webhook data
4. **Rate Limiting**: Consider adding rate limiting to webhook endpoint

## 📊 Monitoring

- **Webhook Deliveries**: Check Resend dashboard
- **Email Count**: Query `SELECT COUNT(*) FROM received_emails`
- **Failed Deliveries**: Check Resend logs
- **Database Usage**: Monitor table size

## 🎯 Next Steps

1. ✅ Complete DNS setup (Step 2)
2. ✅ Add webhook in Resend (Step 3)
3. ✅ Run database migration (Step 5)
4. ✅ Send test email (Step 6)
5. 🚀 Start receiving emails!

---

Need help? Check:
- Resend Docs: https://resend.com/docs/dashboard/receiving/introduction
- Webhook Verification: https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests

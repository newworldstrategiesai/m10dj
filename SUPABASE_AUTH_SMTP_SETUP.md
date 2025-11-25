# 🚨 URGENT: Supabase Auth SMTP Setup Guide

## Problem
Supabase has detected high bounce rates from your project's transactional emails (password resets, magic links, OTPs, email confirmations). This is because you're using Supabase's default SMTP service, which has strict limitations.

## Solution
Configure Resend as your custom SMTP provider for Supabase Auth. This will:
- ✅ Eliminate bounce rate issues
- ✅ Improve email deliverability
- ✅ Give you full control over email sending
- ✅ Allow higher sending limits

---

## Step 1: Get Resend SMTP Credentials

### Option A: If You Already Have Resend API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Copy your API key (starts with `re_`)
3. Use these SMTP credentials:
   - **SMTP Host**: `smtp.resend.com`
   - **SMTP Port**: `587` (STARTTLS) or `465` (SMTPS/SSL)
   - **SMTP Username**: `resend`
   - **SMTP Password**: Your Resend API key (starts with `re_`)

**Port Options:**
- **Port 587** (STARTTLS) - Recommended, explicit SSL/TLS
- **Port 465** (SMTPS) - Implicit SSL/TLS, connects immediately via SSL
- **Port 25** (STARTTLS) - Alternative STARTTLS port
- **Port 2465** (SMTPS) - Alternative SMTPS port
- **Port 2587** (STARTTLS) - Alternative STARTTLS port

### Option B: Create New Resend Account

1. Sign up at [Resend](https://resend.com/signup)
2. Get your API key from [API Keys page](https://resend.com/api-keys)
3. Verify your domain (recommended) or use `onboarding@resend.dev` for testing

**Important**: For production, you MUST verify your domain (`m10djcompany.com`) in Resend.

---

## Step 2: Configure Supabase Auth SMTP

### Method A: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project: `bwayphqnxgcyjpoaautn`

2. **Navigate to Authentication Settings**
   - Go to **Authentication** → **Settings**
   - Scroll down to **SMTP Settings**

3. **Enable Custom SMTP**
   - Toggle **"Enable Custom SMTP"** to ON

4. **Enter SMTP Configuration**
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587 (or 465 for SSL)
   SMTP User: resend
   SMTP Password: [Your Resend API Key - starts with re_]
   Sender Email: hello@m10djcompany.com (or onboarding@resend.dev if domain not verified)
   Sender Name: M10 DJ Company
   ```

   **Port Selection:**
   - **Port 587** (STARTTLS) - Recommended, most compatible
   - **Port 465** (SMTPS) - Use if your client requires immediate SSL connection

5. **Save Settings**
   - Click **"Save"** at the bottom
   - Wait for confirmation message

### Method B: Via Management API (Alternative)

If you prefer using the API, use this script:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="bwayphqnxgcyjpoaautn"
export RESEND_API_KEY="re_your_resend_api_key"

# Configure custom SMTP
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email_enabled": true,
    "mailer_secure_email_change_enabled": true,
    "mailer_autoconfirm": false,
    "smtp_admin_email": "hello@m10djcompany.com",
    "smtp_host": "smtp.resend.com",
    "smtp_port": 587,
    "smtp_user": "resend",
    "smtp_pass": "'"$RESEND_API_KEY"'",
    "smtp_sender_name": "M10 DJ Company"
  }'
```

**Note**: Replace `hello@m10djcompany.com` with `onboarding@resend.dev` if your domain isn't verified yet.

---

## Step 3: Verify Domain in Resend (CRITICAL for Production)

### Why This Matters
- Unverified domains have lower deliverability
- May go to spam folders
- Limited to 100 emails/day
- Shows "via resend.dev" in email clients

### Setup Instructions

1. **Add Domain in Resend**
   - Go to [Resend Domains](https://resend.com/domains)
   - Click **"Add Domain"**
   - Enter: `m10djcompany.com`

2. **Add DNS Records**
   Add these records to your DNS provider (wherever you manage `m10djcompany.com`):

   **SPF Record** (TXT):
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:resend.com ~all
   TTL: 3600
   ```

   **DKIM Record** (CNAME):
   ```
   Type: CNAME
   Name: resend._domainkey
   Value: [Resend will provide this - looks like: xxxxx.dkim.resend.com]
   TTL: 3600
   ```

   **DMARC Record** (TXT) - Optional but recommended:
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@m10djcompany.com
   TTL: 3600
   ```

3. **Verify Domain**
   - Wait 5-15 minutes for DNS propagation
   - Click **"Verify"** in Resend dashboard
   - Status should change to **"Verified"** ✅

4. **Update Supabase SMTP Settings**
   - Change `smtp_admin_email` to: `hello@m10djcompany.com`
   - Or any email address on your verified domain

---

## Step 4: Test the Configuration

### Test 1: Password Reset Email

1. Go to your sign-in page
2. Click "Forgot Password"
3. Enter a valid email address
4. Check your inbox (and spam folder)
5. You should receive an email from `hello@m10djcompany.com` (or `onboarding@resend.dev`)

### Test 2: Magic Link Sign-in

1. Go to your sign-in page
2. Use email sign-in option
3. Enter a valid email
4. Check for the magic link email

### Test 3: Email Confirmation (if enabled)

1. Create a new user account
2. Check for confirmation email

---

## Step 5: Adjust Rate Limits

After setting up custom SMTP, Supabase imposes a default rate limit of **30 messages per hour**. Adjust this:

1. Go to **Authentication** → **Settings** → **Rate Limits**
2. Set appropriate limits for your use case:
   - **Password Reset**: 3 per hour per user
   - **Magic Link**: 3 per hour per user
   - **Email Change**: 3 per hour per user
   - **OTP**: 5 per hour per user

**Important**: Don't set limits too high initially. Start conservative and increase as needed.

---

## Step 6: Additional SMTP Features

### Port Options Explained

Resend supports multiple ports for different security requirements:

| Port | Type | Security | Use Case |
|------|------|----------|----------|
| **587** | STARTTLS | Explicit SSL/TLS | **Recommended** - Most compatible, connects plaintext then upgrades |
| **465** | SMTPS | Implicit SSL/TLS | Use if client requires immediate SSL connection |
| **25** | STARTTLS | Explicit SSL/TLS | Alternative STARTTLS port (may be blocked by some networks) |
| **2465** | SMTPS | Implicit SSL/TLS | Alternative SMTPS port |
| **2587** | STARTTLS | Explicit SSL/TLS | Alternative STARTTLS port |

**Recommendation**: Start with port **587** (STARTTLS). If that doesn't work, try **465** (SMTPS).

### Idempotency Keys

Resend supports idempotency keys via SMTP to prevent duplicate emails. Add this header:

```
Resend-Idempotency-Key: unique-key-here
```

**Example**: `Resend-Idempotency-Key: password-reset/user-123/2025-01-15`

This is useful for Supabase Auth emails to prevent duplicate sends if there are retries. Note: Supabase Auth may not support custom headers directly, but this feature is available if you're sending emails via SMTP from your own code.

### Custom Headers

You can add custom headers via SMTP for advanced functionality:

- **X-Entity-Ref-ID**: Prevent email threading in Gmail
- **List-Unsubscribe**: Add unsubscribe functionality for compliance
- **X-Priority**: Set email priority (1 = High, 3 = Normal, 5 = Low)

**Note**: Supabase Auth's SMTP integration may have limited support for custom headers. Test thoroughly if you need these features.

### Viewing SMTP Emails

All emails sent via SMTP (including Supabase Auth emails) will appear in your [Resend Emails dashboard](https://resend.com/emails), where you can:
- ✅ See delivery status
- ✅ View bounce reports  
- ✅ Check spam complaints
- ✅ Monitor sending rates
- ✅ Debug delivery issues

---

## Step 7: Monitor Email Deliverability

### Check Resend Dashboard

1. Go to [Resend Emails](https://resend.com/emails)
2. Monitor:
   - **Delivery rate** (should be >95%)
   - **Bounce rate** (should be <5%)
   - **Spam complaints** (should be <0.1%)
3. All SMTP emails (including Supabase Auth) appear here

### Check Supabase Logs

1. Go to **Logs** → **Auth Logs** in Supabase Dashboard
2. Look for email sending errors
3. Monitor bounce rates
4. Check for SMTP connection errors

---

## 🚨 Preventing Spam Issues

### Critical: DNS Records Must Be Correct

If emails are going to spam, check these DNS records:

1. **SPF Record** (TXT on root domain):
   ```
   v=spf1 include:resend.com ~all
   ```

2. **DKIM Record** (CNAME from Resend):
   ```
   resend._domainkey → [Resend's DKIM server]
   ```

3. **DMARC Record** (TXT):
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@m10djcompany.com
   ```

**See**: `DNS_RECORDS_FOR_RESEND.md` for detailed DNS setup instructions.

### Email Content Best Practices

**✅ DO:**
- Use clear, descriptive subject lines
- Include your company name in sender
- Add physical mailing address (CAN-SPAM requirement)
- Use your verified domain for all links
- Keep HTML simple and clean

**❌ DON'T:**
- Use ALL CAPS in subject
- Excessive exclamation marks!!!
- Generic sender names
- Suspicious link text ("Click here", "Verify now")
- Too many links in one email

### If Emails Still Go to Spam

1. **Verify domain is verified** in Resend (should show green ✅)
2. **Check DNS records** are correct (see above)
3. **Use custom auth domain** instead of Supabase URLs
4. **Test with Mail-Tester**: https://www.mail-tester.com/
5. **Check email headers** for SPF/DKIM/DMARC = PASS

**See**: `FIX_SPAM_ISSUES.md` for comprehensive spam prevention guide.

---

## Troubleshooting

### Issue: "SMTP authentication failed"

**Solutions:**
- ✅ Verify your Resend API key is correct (must start with `re_`)
- ✅ Check that `smtp_user` is set to exactly `resend` (always this, never your API key)
- ✅ Ensure `smtp_pass` is your full API key (the password field, not username)
- ✅ Try different ports:
  - Port `587` with STARTTLS (most common, recommended)
  - Port `465` with SMTPS/SSL (if client requires immediate SSL)
  - Port `25` with STARTTLS (alternative, may be blocked)
- ✅ Verify API key is active in Resend dashboard
- ✅ Check for typos in credentials (copy-paste recommended)

### Issue: Emails still bouncing

**Solutions:**
- Verify your domain in Resend
- Check DNS records are correct
- Ensure sender email matches verified domain
- Review Resend dashboard for bounce reasons

### Issue: "Email address not authorized"

**Solutions:**
- This happens with Supabase's default SMTP
- After setting up custom SMTP, this should disappear
- If it persists, check SMTP configuration is saved

### Issue: Rate limit errors

**Solutions:**
- Increase rate limits in Supabase settings
- Check Resend account limits (free tier: 100/day)
- Upgrade Resend plan if needed
- Note: SMTP rate limits are the same as API rate limits

### Issue: Port connection errors

**Solutions:**
- Try port `587` first (STARTTLS - most compatible)
- If that fails, try port `465` (SMTPS/SSL)
- Some networks block port 25, so avoid it if possible
- Check firewall settings if connection fails

---

## Best Practices

### ✅ DO:

1. **Use verified domain** for production
2. **Monitor bounce rates** regularly
3. **Set appropriate rate limits** to prevent abuse
4. **Use separate domains** for auth vs marketing emails
5. **Keep email templates simple** (avoid spam triggers)
6. **Test with real email addresses** before going live

### ❌ DON'T:

1. **Don't disable email confirmations** (security risk)
2. **Don't use test emails** in production
3. **Don't send to unverified addresses**
4. **Don't ignore bounce reports**
5. **Don't mix auth and marketing emails** (use separate services)

---

## Email Template Best Practices

### Keep Templates Simple

- ✅ Short, clear subject lines
- ✅ Minimal HTML (avoid complex layouts)
- ✅ No excessive images
- ✅ Clear call-to-action buttons
- ✅ Professional but simple design

### Avoid Spam Triggers

- ❌ ALL CAPS in subject
- ❌ Excessive exclamation marks!!!
- ❌ Promotional content in auth emails
- ❌ Multiple links
- ❌ Email signatures (keep minimal)

---

## Cost Considerations

### Resend Pricing

- **Free Tier**: 100 emails/day, 1 verified domain
- **Pro**: $20/month, 50,000 emails/month, unlimited domains
- **Enterprise**: Custom pricing

**Recommendation**: Start with free tier, upgrade when you exceed limits.

### Supabase Auth Emails

These count toward your Resend quota:
- Password reset emails
- Magic link emails
- Email confirmation emails
- OTP emails
- Email change confirmations

---

## Next Steps

1. ✅ Set up Resend SMTP in Supabase (Step 2)
2. ✅ Verify domain in Resend (Step 3)
3. ✅ Test email sending (Step 4)
4. ✅ Adjust rate limits (Step 5)
5. ✅ Monitor deliverability (Step 6)
6. ✅ Review and optimize email templates

---

## Support Resources

- [Resend Documentation](https://resend.com/docs)
- [Supabase Auth SMTP Guide](https://supabase.com/docs/guides/auth/auth-smtp)
- [Resend Discord](https://resend.com/discord)
- [Supabase Support](https://supabase.com/support)

---

## Quick Checklist

- [ ] Resend account created
- [ ] Resend API key obtained
- [ ] SMTP configured in Supabase Dashboard
- [ ] Domain verified in Resend (for production)
- [ ] DNS records added (SPF, DKIM, DMARC)
- [ ] Test email sent successfully
- [ ] Rate limits adjusted
- [ ] Monitoring set up
- [ ] Email templates reviewed

---

**Last Updated**: January 2025
**Status**: ✅ Ready to implement


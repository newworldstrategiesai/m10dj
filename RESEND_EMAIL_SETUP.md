# Resend Email Setup Guide

## Current Status
✅ Code is configured to use Resend  
⚠️ Need to verify Resend API key and domain setup

---

## Step 1: Get Your Resend API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key (or use existing)
3. Copy the API key (starts with `re_`)

---

## Step 2: Add API Key to Environment

### For Local Development (.env.local):
```bash
RESEND_API_KEY=re_your_api_key_here
```

### For Vercel/Production:
1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
   - Name: `RESEND_API_KEY`
   - Value: `re_your_api_key_here`
4. Apply to: Production, Preview, Development

---

## Step 3: Verify Domain (IMPORTANT!)

### Option A: Use Resend's Testing Domain (Quick Start)
- Email from: `onboarding@resend.dev`
- ✅ Works immediately
- ⚠️ Limited to 100 emails/day
- ⚠️ May go to spam
- ⚠️ Shows "via resend.dev" in email clients

### Option B: Use Your Own Domain (Recommended for Production)

1. **Add Domain in Resend**
   - Go to [Resend Domains](https://resend.com/domains)
   - Click "Add Domain"
   - Enter your domain (e.g., `m10djcompany.com`)

2. **Add DNS Records**
   Copy these records to your DNS provider (Cloudflare, GoDaddy, etc.):

   ```
   Type: TXT
   Name: @
   Value: [Resend will provide this]

   Type: CNAME
   Name: resend._domainkey
   Value: [Resend will provide this]

   Type: MX
   Name: @
   Priority: 10
   Value: feedback-smtp.us-east-1.amazonses.com
   ```

3. **Verify Domain**
   - Wait 5-15 minutes for DNS propagation
   - Click "Verify" in Resend dashboard
   - Status should change to "Verified" ✅

4. **Update Code**
   Change the "from" address in `pages/api/admin/communications/send-email.js`:
   ```javascript
   from: 'M10 DJ Company <hello@m10djcompany.com>',
   // Instead of: 'M10 DJ Company <onboarding@resend.dev>'
   ```

---

## Step 4: Test Email Sending

### Method 1: Via Terminal Logs
1. Restart your dev server: `npm run dev`
2. Send a test email from Form Submissions
3. Check terminal for these logs:
   ```
   📧 Attempting to send email via Resend...
      To: test@example.com
      Subject: Test Email
      From: M10 DJ Company <onboarding@resend.dev>
   ✅ Email sent via Resend successfully
      Email ID: abc123...
      Status: SUCCESS
   ```

### Method 2: Via Resend Dashboard
1. Go to [Resend Emails](https://resend.com/emails)
2. You should see sent emails listed
3. Check delivery status

### Method 3: Check Your Inbox
1. Send email to your own email address
2. Check inbox AND spam folder
3. If using `onboarding@resend.dev`, check spam first

---

## Troubleshooting

### Issue: "Email service not configured"
**Solution:**
- Check `.env.local` has `RESEND_API_KEY=re_...`
- Restart dev server after adding env variable
- Verify no typos in variable name

### Issue: Emails going to spam
**Solution:**
- Set up custom domain (Option B above)
- Add SPF, DKIM, and DMARC records
- Use a "from" address on your verified domain

### Issue: API key invalid
**Solution:**
- Verify key starts with `re_`
- No extra spaces or quotes around key
- Regenerate key in Resend dashboard if needed

### Issue: Rate limit exceeded
**Solution:**
- Using testing domain? Upgrade to verified domain
- Free tier: 100 emails/day
- Paid tier: 50,000+ emails/month

---

## Recommended Setup for M10 DJ

### Immediate (Testing):
```javascript
from: 'M10 DJ Company <onboarding@resend.dev>'
```

### Production (After Domain Verification):
```javascript
from: 'Ben Murray <ben@m10djcompany.com>'
// or
from: 'M10 DJ Company <hello@m10djcompany.com>'
// or
from: 'M10 DJ Bookings <bookings@m10djcompany.com>'
```

---

## Email Deliverability Best Practices

1. **Use Custom Domain** - Dramatically improves deliverability
2. **Warm Up Your Domain** - Start with small volumes, increase gradually
3. **Monitor Bounce Rates** - Check Resend dashboard for bounces
4. **Avoid Spam Triggers** - No ALL CAPS, excessive exclamation marks!!!
5. **Include Unsubscribe Link** - For marketing emails (required by law)
6. **Test Before Sending** - Send to yourself first

---

## Current Code Configuration

**File:** `pages/api/admin/communications/send-email.js`

```javascript
// Line 6
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Line 70-76
const emailResult = await resend.emails.send({
  from: 'M10 DJ Company <onboarding@resend.dev>',
  to: [emailTo],
  subject: emailSubject,
  html: htmlContent,
  text: emailContent
});
```

To change sender:
1. Verify your domain in Resend
2. Update line 71 with your email
3. Redeploy to production

---

## Cost

**Resend Pricing:**
- Free: 100 emails/day, 1 verified domain
- Pro: $20/month, 50,000 emails/month, unlimited domains
- Enterprise: Custom pricing

**Recommendation:** Start free, upgrade when needed

---

## Support

- [Resend Documentation](https://resend.com/docs)
- [Resend Discord](https://resend.com/discord)
- [Resend Status Page](https://status.resend.com)

---

## Quick Checklist

- [ ] Resend account created
- [ ] API key added to `.env.local`
- [ ] API key added to Vercel env variables
- [ ] Dev server restarted
- [ ] Test email sent successfully
- [ ] Domain verified (optional but recommended)
- [ ] "From" address updated (after domain verification)
- [ ] Production deployment tested

---

## Next Steps

1. Add `RESEND_API_KEY` to your environment
2. Restart dev server
3. Try sending an email
4. Check terminal logs for success/errors
5. If working: Consider setting up custom domain
6. If not working: Share error logs for debugging


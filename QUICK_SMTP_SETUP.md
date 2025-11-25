# ⚡ Quick SMTP Setup - 5 Minute Guide

## 🚨 URGENT: Fix Email Bounce Issue

Supabase is warning about high bounce rates. Fix it now in 5 minutes:

---

## Step 1: Get Your Tokens (2 minutes)

1. **Supabase Access Token**
   - Go to: https://supabase.com/dashboard/account/tokens
   - Create/copy your access token

2. **Resend API Key** (you should already have this)
   - Go to: https://resend.com/api-keys
   - Copy your API key (starts with `re_`)

---

## Step 2: Add to `.env.local` (30 seconds)

```bash
SUPABASE_ACCESS_TOKEN=your-token-here
SUPABASE_PROJECT_REF=bwayphqnxgcyjpoaautn
RESEND_API_KEY=re_your_key_here
SMTP_SENDER_EMAIL=hello@m10djcompany.com
SMTP_SENDER_NAME=M10 DJ Company
```

---

## Step 3: Run Configuration Script (1 minute)

```bash
node scripts/configure-supabase-smtp.js
```

**OR** configure manually in Supabase Dashboard:
1. Go to: Authentication → Settings → SMTP Settings
2. Enable Custom SMTP
3. Enter:
   - Host: `smtp.resend.com`
   - Port: `587` (or `465` for SSL)
   - User: `resend` (always this, not your API key)
   - Password: Your Resend API key (starts with `re_`)
   - Sender: `hello@m10djcompany.com`

---

## Step 4: Test It (1 minute)

1. Go to your sign-in page
2. Click "Forgot Password"
3. Enter your email
4. Check inbox for email from `hello@m10djcompany.com`

---

## ✅ Done!

Your bounce rate issue should be resolved. 

**Next**: Verify your domain in Resend for better deliverability (see `SUPABASE_AUTH_SMTP_SETUP.md`)

---

## 📚 Full Documentation

- **Complete Guide**: `SUPABASE_AUTH_SMTP_SETUP.md`
- **Summary**: `EMAIL_BOUNCE_FIX_SUMMARY.md`


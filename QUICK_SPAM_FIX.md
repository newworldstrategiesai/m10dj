# ⚡ Quick Spam Fix - 10 Minutes

## Your emails are going to spam. Fix it now:

---

## Step 1: Verify Domain in Resend (2 min)

1. Go to [Resend Domains](https://resend.com/domains)
2. Click **"Add Domain"** → Enter `m10djcompany.com`
3. Copy the DKIM record Resend shows you

---

## Step 2: Add DNS Records (5 min)

**If using Vercel**: See `VERCEL_DNS_RESEND_SETUP.md` for exact steps.

Add these 3 records to your DNS:

### Record 1: SPF
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
```

### Record 2: DKIM (from Resend)
```
Type: CNAME
Name: resend._domainkey
Value: [copy from Resend dashboard]
```

### Record 3: DMARC
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@m10djcompany.com
```

---

## Step 3: Verify & Update (3 min)

1. Wait 5 minutes for DNS to propagate
2. Go back to Resend → Click **"Verify"**
3. Status should be **"Verified"** ✅
4. Update Supabase SMTP sender to: `hello@m10djcompany.com`

---

## ✅ Done!

Your emails should now go to inbox instead of spam.

**Full guide**: See `FIX_SPAM_ISSUES.md` for detailed instructions.


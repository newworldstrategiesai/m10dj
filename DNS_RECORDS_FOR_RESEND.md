# 🔧 DNS Records for Resend Email (m10djcompany.com)

## Current Problem
Your DNS records are not correctly configured for Resend, causing emails to go to spam.

## Required DNS Records

Add these records to your DNS provider (wherever you manage `m10djcompany.com`):

---

## 1. SPF Record (TXT) - Root Domain

**Purpose**: Authorizes Resend to send emails on your behalf

```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
TTL: 3600
```

**Note**: The `@` means root domain (`m10djcompany.com`)

---

## 2. DKIM Record (CNAME) - From Resend Dashboard

**Purpose**: Signs your emails to prove they're authentic

1. Go to [Resend Domains](https://resend.com/domains)
2. Click on `m10djcompany.com` (or add it if not there)
3. Resend will show you a DKIM record like:

```
Type: CNAME
Name: resend._domainkey
Value: [something like: xxxxx.dkim.resend.com]
TTL: 3600
```

**Important**: Copy the exact value from Resend - it's unique to your account.

---

## 3. DMARC Record (TXT) - Critical for Spam Prevention

**Purpose**: Tells email providers how to handle emails that fail SPF/DKIM

### Start with Quarantine (Soft Fail):
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@m10djcompany.com; ruf=mailto:dmarc@m10djcompany.com; pct=100
TTL: 3600
```

### After 30 Days (If Everything Works):
Change to Reject (Hard Fail):
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=reject; rua=mailto:dmarc@m10djcompany.com; ruf=mailto:dmarc@m10djcompany.com; pct=100
TTL: 3600
```

**What this means:**
- `p=quarantine`: Emails that fail authentication go to spam (not rejected)
- `p=reject`: Emails that fail authentication are rejected (more strict)
- `rua`: Where to send aggregate reports
- `ruf`: Where to send failure reports

---

## 4. MX Record (Optional - Only if Receiving Emails)

If you're using Resend to receive emails (not just send), add:

```
Type: MX
Name: @
Priority: 10
Value: feedback-smtp.us-east-1.amazonses.com
```

**Note**: Most people only need this if they're receiving emails via Resend.

---

## How to Add These Records

### If Using Vercel DNS:
**See**: `VERCEL_DNS_RESEND_SETUP.md` for detailed Vercel-specific instructions.

Quick steps:
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click on `m10djcompany.com`
3. Click "DNS Records"
4. Add SPF record on root domain (`@` or empty name)
5. Update `resend._domainkey` to CNAME (from Resend)
6. Update `_dmarc` to `p=quarantine`

### If Using Cloudflare:
1. Go to Cloudflare Dashboard
2. Select `m10djcompany.com`
3. Go to DNS → Records
4. Add each record above

### If Using GoDaddy/Namecheap/Other:
1. Log into your domain registrar
2. Go to DNS Management
3. Add each record above

---

## Verify Records Are Correct

### Check SPF:
```bash
dig TXT m10djcompany.com | grep spf
```
Should show: `v=spf1 include:resend.com ~all`

### Check DKIM:
```bash
dig CNAME resend._domainkey.m10djcompany.com
```
Should show Resend's DKIM server.

### Check DMARC:
```bash
dig TXT _dmarc.m10djcompany.com
```
Should show your DMARC policy.

### Online Tools:
- [MXToolbox SPF Check](https://mxtoolbox.com/spf.aspx)
- [MXToolbox DMARC Check](https://mxtoolbox.com/dmarc.aspx)
- [DMARC Analyzer](https://www.dmarcanalyzer.com/)

---

## After Adding Records

1. **Wait 5-15 minutes** for DNS propagation
2. **Go to Resend Dashboard** → Domains
3. **Click "Verify"** next to your domain
4. **Status should change to "Verified"** ✅

---

## Common Issues

### Issue: "SPF record not found"
**Solution**: Make sure the SPF record is on the root domain (`@`), not a subdomain.

### Issue: "DKIM verification failed"
**Solution**: 
- Double-check you copied the exact CNAME value from Resend
- Make sure the record name is exactly `resend._domainkey`
- Wait longer for DNS propagation (can take up to 24 hours)

### Issue: "DMARC not configured"
**Solution**: Make sure the DMARC record name is exactly `_dmarc` (with underscore).

---

## Current vs. Correct Configuration

### ❌ Current (Wrong):
```
SPF: on "send" subdomain (wrong)
DKIM: TXT record with key (wrong - should be CNAME)
DMARC: p=none (too permissive)
```

### ✅ Correct:
```
SPF: on root domain (@)
DKIM: CNAME pointing to Resend
DMARC: p=quarantine (then p=reject after 30 days)
```

---

## Next Steps After DNS Setup

1. ✅ Verify domain in Resend
2. ✅ Update Supabase SMTP sender to `hello@m10djcompany.com`
3. ✅ Test email sending
4. ✅ Check spam folder - should go to inbox
5. ✅ Monitor deliverability for 1 week

---

**Priority**: 🔴 URGENT - Fix DNS records immediately to stop spam issues
**Last Updated**: January 2025


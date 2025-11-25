# 🔧 Vercel DNS Setup for Resend (m10djcompany.com)

## Current Situation

Looking at your Resend dashboard, I can see:
- ✅ DKIM record (`resend._domainkey`) is verified ✅
- ✅ SPF record on `send` subdomain includes `amazonses.com`
- ❌ **SPF record does NOT include `resend.com`** (this is the problem!)
- ❌ **Missing SPF record on root domain (`@`) for Resend**

**The Issue**: Your SPF record only authorizes Amazon SES to send emails, not Resend. This is why emails go to spam!

## What You Need to Add/Change

You need to add Resend records **without breaking** your existing Amazon SES setup.

---

## Step 1: Add SPF Record for Resend (Root Domain)

### In Vercel Dashboard:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. Click on `m10djcompany.com`
3. Click **"DNS Records"** tab
4. Click **"Add"** button
5. Fill in:
   - **Name**: `@` (or leave empty for root domain)
   - **Type**: `TXT`
   - **Value**: `v=spf1 include:resend.com include:amazonses.com ~all`
   - **TTL**: `3600` (or leave default)
6. Click **"Save"**

**Why this is needed**: 
- Your current SPF on `send` subdomain only includes Amazon SES
- Resend needs authorization on the root domain (`@`)
- This allows both Resend AND Amazon SES to send emails

**Alternative**: If you want to keep using the `send` subdomain approach, update the existing SPF record on `send` to include Resend:
```
v=spf1 include:resend.com include:amazonses.com ~all
```
But it's better to have SPF on root domain for Resend.

---

## Step 2: DKIM Record Status

**Good News**: Your DKIM record is already verified in Resend! ✅

Looking at your Resend dashboard:
- ✅ `resend._domainkey` TXT record is verified
- ✅ Status shows "Verified" in green

**No action needed** for DKIM - it's already working correctly.

**Note**: Some email providers prefer CNAME for DKIM, but Resend accepts TXT records and yours is verified, so you're good!

---

## Step 3: DKIM Record (Already Done!)

**Your DKIM is already verified** - no changes needed! ✅

The `resend._domainkey` TXT record in your Vercel DNS is working correctly and shows as "Verified" in Resend.

---

## Step 4: Update DMARC Record

Your current DMARC is `p=none` which is too permissive. Update it:

1. In Vercel DNS, find the `_dmarc` TXT record
2. Click **Edit** (or delete and recreate)
3. Update the value to:
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@m10djcompany.com; ruf=mailto:dmarc@m10djcompany.com; pct=100
   ```
4. Click **"Save"**

**What this does:**
- `p=quarantine`: Emails that fail authentication go to spam (not rejected)
- After 30 days of good deliverability, change to `p=reject` for stricter enforcement

---

## Step 5: Verify Domain in Resend

1. Wait **5-15 minutes** for DNS propagation
2. Go to [Resend Domains](https://resend.com/domains)
3. Find `m10djcompany.com`
4. Click **"Verify"** button
5. Status should change to **"Verified"** ✅

---

## Complete DNS Record Summary

After setup, you should have:

### For Resend (Email Sending):
- ✅ **SPF** (TXT on `@`): `v=spf1 include:resend.com include:amazonses.com ~all` ← **ADD THIS**
- ✅ **DKIM** (TXT): `resend._domainkey` → Already verified ✅
- ✅ **DMARC** (TXT): `v=DMARC1; p=quarantine; rua=mailto:dmarc@m10djcompany.com` ← **UPDATE THIS**

### For Amazon SES (If Still Using):
- ✅ **SPF** (TXT on `send`): `v=spf1 include:amazonses.com ~all` (keep this)
- ✅ **MX** records (keep if receiving emails via SES)

### For Vercel (Website):
- ✅ **ALIAS** records (keep these - Vercel manages them)

**The main fix**: Add SPF record on root domain (`@`) that includes `resend.com`

---

## Visual Guide: What to Add in Vercel

```
┌─────────────────────────────────────────────────┐
│ Vercel DNS Records                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ ADD THIS:                                       │
│ ┌───────────────────────────────────────────┐ │
│ │ Name: @ (or empty)                        │ │
│ │ Type: TXT                                  │ │
│ │ Value: v=spf1 include:resend.com          │ │
│ │        include:amazonses.com ~all          │ │
│ │ TTL: 3600                                  │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│ UPDATE THIS:                                   │
│ ┌───────────────────────────────────────────┐ │
│ │ Name: resend._domainkey                   │ │
│ │ Type: CNAME (change from TXT!)            │ │
│ │ Value: [from Resend dashboard]            │ │
│ │ TTL: 3600                                 │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│ UPDATE THIS:                                   │
│ ┌───────────────────────────────────────────┐ │
│ │ Name: _dmarc                               │ │
│ │ Type: TXT                                  │ │
│ │ Value: v=DMARC1; p=quarantine;            │ │
│ │        rua=mailto:dmarc@m10djcompany.com  │ │
│ │ TTL: 3600                                 │ │
│ └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: "Can't add record - already exists"

**Solution**: 
- If SPF exists on `send` subdomain, that's fine - add another on root (`@`)
- If `resend._domainkey` exists as TXT, delete it and add as CNAME

### Issue: "Domain verification failed in Resend"

**Solutions**:
1. Wait longer (DNS can take up to 24 hours, usually 5-15 min)
2. Check DKIM record is CNAME (not TXT)
3. Verify SPF includes `resend.com`
4. Use [MXToolbox](https://mxtoolbox.com/spf.aspx) to verify records

### Issue: "Both SES and Resend need to work"

**Solution**: 
- SPF can include both: `v=spf1 include:resend.com include:amazonses.com ~all`
- Keep separate DKIM records (SES uses TXT, Resend uses CNAME)
- They won't conflict

---

## Verify Records Are Live

### Check SPF:
```bash
dig TXT m10djcompany.com | grep spf
```
Should show: `v=spf1 include:resend.com include:amazonses.com ~all`

### Check DKIM:
```bash
dig CNAME resend._domainkey.m10djcompany.com
```
Should show Resend's DKIM server.

### Check DMARC:
```bash
dig TXT _dmarc.m10djcompany.com
```
Should show: `v=DMARC1; p=quarantine;...`

---

## After DNS Setup

1. ✅ Verify domain in Resend (should be green ✅)
2. ✅ Update Supabase SMTP sender to `hello@m10djcompany.com`
3. ✅ Test email sending
4. ✅ Check spam folder - should go to inbox now

---

## Quick Checklist

- [ ] Added SPF record on root domain (`@`) with `include:resend.com`
- [ ] Got DKIM CNAME from Resend dashboard
- [ ] Updated `resend._domainkey` to CNAME (not TXT)
- [ ] Updated DMARC to `p=quarantine`
- [ ] Waited 5-15 minutes for DNS propagation
- [ ] Verified domain in Resend (status = Verified ✅)
- [ ] Updated Supabase SMTP sender email
- [ ] Tested email delivery

---

**Priority**: 🔴 URGENT - Fix DNS records to stop spam issues
**Last Updated**: January 2025


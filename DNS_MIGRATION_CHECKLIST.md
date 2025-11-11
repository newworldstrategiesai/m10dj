# 🌐 DNS Migration Checklist - Namecheap Basic DNS

**Date:** November 10, 2025  
**Action:** Switched from Custom DNS to Namecheap Basic DNS  
**Site Status:** ✅ Currently UP (checked: site is accessible)

---

## ✅ Immediate Status Check

### Website Status
```
✅ Domain resolving: m10djcompany.com → 64.29.17.65, 216.198.79.1
✅ Site accessible: HTTP 307 (redirect to HTTPS - normal)
✅ No immediate downtime detected
```

---

## 🚨 CRITICAL: DNS Records You MUST Have

### 1. Website Hosting Records (REQUIRED)
These point your domain to your hosting provider:

**If using Vercel:**
```
Type: A
Host: @
Value: 76.76.21.21

Type: CNAME
Host: www
Value: cname.vercel-dns.com
```

**If using a different host:**
- Check your hosting provider's DNS requirements
- Usually A record for @ and CNAME for www

### 2. Email Records (For Resend - REQUIRED for email notifications)
**You need to add these in Namecheap to fix your email issue:**

Go to Resend Dashboard → Domains to get your specific values:
```
Type: TXT
Host: @
Value: [Get from Resend dashboard]

Type: CNAME
Host: resend._domainkey
Value: [Get from Resend dashboard]

Type: CNAME  
Host: resend2._domainkey
Value: [Get from Resend dashboard]
```

### 3. SSL/HTTPS Records (Usually automatic)
Most hosts handle this automatically, but verify HTTPS works:
- https://m10djcompany.com
- https://www.m10djcompany.com

---

## 📋 Action Items (DO THESE NOW)

### Step 1: Verify Your Website Records in Namecheap
1. Log into Namecheap
2. Go to Domain List → m10djcompany.com → Advanced DNS
3. Make sure you have:
   - ✅ A record pointing to your host
   - ✅ CNAME for www
   - ✅ Any other records that were there before

### Step 2: Add Resend Email Records (CRITICAL)
**This is what's blocking your lead notification emails!**

1. Go to: https://resend.com/domains
2. Click "Add Domain" 
3. Enter: m10djcompany.com
4. Copy the DNS records Resend provides
5. Go to Namecheap → Advanced DNS
6. Click "Add New Record" for each one:
   - TXT record for SPF
   - CNAME for DKIM (resend._domainkey)
   - CNAME for DKIM2 (resend2._domainkey)
7. Wait 5-30 minutes
8. Go back to Resend and click "Verify"

### Step 3: Update Your Code
Once domain is verified in Resend, I'll update the code to use:
```javascript
from: 'M10 DJ Company <hello@m10djcompany.com>'
```
Instead of the test domain.

---

## ⚠️ What Could Break

### If Missing Website Records:
- ❌ Site could go offline
- ❌ www subdomain might not work
- ❌ SSL certificate might break

### If Missing Email Records:
- ❌ Lead notifications won't send (ALREADY BROKEN)
- ❌ Customer confirmations won't send
- ❌ All automated emails blocked

### If Missing Other Records:
- ❌ Subdomains might break
- ❌ Third-party integrations might fail
- ❌ Email forwarding might stop

---

## 🔍 How to Check Everything

### Check Website
```bash
# Check if site loads
curl -I https://m10djcompany.com

# Check DNS
nslookup m10djcompany.com
```

### Check Email Records
```bash
# Check TXT records
nslookup -type=TXT m10djcompany.com

# Check DKIM
nslookup -type=CNAME resend._domainkey.m10djcompany.com
```

---

## 🎯 Priority Order

1. **IMMEDIATE** - Verify website A records are in place
2. **HIGH** - Add Resend email verification records
3. **MEDIUM** - Check any other services using DNS
4. **LOW** - Optimize DNS settings

---

## 📞 What to Do If Site Goes Down

1. **Don't Panic** - DNS changes take time to propagate
2. **Check Namecheap DNS settings** - Make sure records are there
3. **Contact Namecheap support** if needed
4. **Can switch back to custom DNS** if necessary

---

## ✅ DNS Record Template for Namecheap

Copy this to Namecheap Advanced DNS:

### Website Records
```
Type: A
Host: @
Value: [Your hosting IP]
TTL: Automatic

Type: CNAME
Host: www
Value: [Your hosting CNAME]
TTL: Automatic
```

### Email Records (Get exact values from Resend)
```
Type: TXT
Host: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: Automatic

Type: CNAME
Host: resend._domainkey
Value: [From Resend]
TTL: Automatic

Type: CNAME
Host: resend2._domainkey
Value: [From Resend]  
TTL: Automatic
```

---

## 🚀 Next Steps

1. **NOW**: Verify site is working → Test https://m10djcompany.com
2. **NOW**: Check Namecheap DNS has hosting records
3. **TODAY**: Add Resend domain verification records
4. **TODAY**: Verify domain in Resend dashboard
5. **TODAY**: Test email notifications again

---

## 📊 Current Status

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Website | ✅ UP | Verify A records in Namecheap |
| www subdomain | ? | Test and verify |
| Email (Resend) | ❌ BROKEN | Add verification records |
| SSL/HTTPS | ✅ Working | None |
| DNS Resolution | ✅ Working | None |

---

## 💡 Pro Tip

**Before making DNS changes in the future:**
1. Take screenshots of all existing records
2. Make a list of all services using DNS
3. Have a rollback plan
4. Test everything after changes

---

**Need Help?**
- Namecheap Support: https://www.namecheap.com/support/
- Resend Support: support@resend.com
- Your hosting provider's support

---

**BOTTOM LINE:**
- ✅ Your site is currently working
- ❌ Your emails are still broken (were already broken)
- 🔧 You MUST add Resend DNS records to fix emails
- ⚠️ Monitor your site for the next 24 hours to ensure stability


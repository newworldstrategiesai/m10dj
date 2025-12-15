# ⚡ Quick Domain Setup Guide

## 🚀 Fast Track: Connect Your Domains (15 minutes)

### Step 1: Add Domains to Vercel (2 min)

1. Go to: https://vercel.com/dashboard
2. Click your project → **Settings** → **Domains**
3. Click **"Add Domain"**
4. Enter: `tipjar.live` → **Add**
5. Click **"Add Domain"** again
6. Enter: `djdash.net` → **Add**

### Step 2: Get Nameservers from Vercel (1 min)

After adding each domain, Vercel will show:
- **Nameserver 1**: `ns1.vercel-dns.com`
- **Nameserver 2**: `ns2.vercel-dns.com`

**Copy these!** You'll need them in Spaceship.

### Step 3: Update Nameservers in Spaceship (5 min)

1. Go to: https://spaceship.com
2. Click **"Domains"** → Select `tipjar.live`
3. Find **"Nameservers"** or **"DNS Settings"**
4. Change to **Custom Nameservers**:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
5. **Save**
6. Repeat for `djdash.net`

### Step 4: Wait & Verify (24-48 hours)

1. **Check Vercel Dashboard**
   - Settings → Domains
   - Should show: ✅ Valid Configuration

2. **Test Domains**
   - Visit: `https://tipjar.live`
   - Visit: `https://djdash.net`
   - Both should show your app!

---

## 🔍 SEO: Will They Appear Separately?

### **YES - They will appear as separate entities** ✅

This is **GOOD** for SEO:

✅ **3x More Search Opportunities**
- Each domain can rank independently
- More chances to appear in Google
- Different keywords per domain

✅ **Better Keyword Targeting**
- `tipjar.live` → "tip jar app", "song requests"
- `djdash.net` → "DJ dashboard", "DJ CRM"
- `m10djcompany.com` → Brand terms, platform

✅ **Separate Domain Authority**
- Each domain builds its own authority
- Links help the specific domain
- No dilution of SEO value

### ⚠️ Important: Prevent Duplicate Content

**Use Canonical URLs** (I'll implement this):

```html
<!-- On tipjar.live -->
<link rel="canonical" href="https://tipjar.live/requests" />

<!-- On djdash.net (same page) -->
<link rel="canonical" href="https://djdash.net/requests" />
```

This tells Google: "These are the same page, but on different domains for different purposes."

---

## 📋 Setup Checklist

- [ ] Add `tipjar.live` to Vercel
- [ ] Add `djdash.net` to Vercel
- [ ] Update nameservers in Spaceship
- [ ] Wait 24-48 hours for DNS
- [ ] Verify domains work
- [ ] Test HTTPS (automatic)
- [ ] Set up Google Search Console (separate for each)
- [ ] Submit sitemaps (one per domain)

---

## 🎯 Next Steps After Domains Are Live

1. **Implement domain detection** (I'll help with this)
2. **Create unique landing pages** per domain
3. **Set up separate Google Search Console** properties
4. **Submit domain-specific sitemaps**
5. **Build backlinks** to each domain separately

---

**Need help?** Check `DOMAIN_SETUP_GUIDE.md` for detailed instructions!




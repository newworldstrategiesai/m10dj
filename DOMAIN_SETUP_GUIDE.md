# 🌐 Domain Setup Guide: Connecting tipjar.live & djdash.net

## Step-by-Step: Connecting Domains from Spaceship to Vercel

### Step 1: Get Your Vercel Domain Configuration

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project (m10dj)

2. **Navigate to Domain Settings**
   - Click on your project
   - Go to **Settings** → **Domains**

3. **Add Your First Domain (tipjar.live)**
   - Click **"Add Domain"**
   - Enter: `tipjar.live`
   - Click **"Add"**
   - Vercel will show you DNS configuration instructions

4. **Add Your Second Domain (djdash.net)**
   - Click **"Add Domain"** again
   - Enter: `djdash.net`
   - Click **"Add"**
   - Note the DNS records Vercel provides

### Step 2: Configure DNS in Spaceship

You have two options:

#### **Option A: Use Vercel Nameservers (Recommended)** ✅

This is the easiest and most reliable method:

1. **Get Vercel Nameservers**
   - In Vercel, when you add a domain, it will show you nameservers like:
     - `ns1.vercel-dns.com`
     - `ns2.vercel-dns.com`

2. **Update Nameservers in Spaceship**
   - Log into Spaceship.com
   - Go to **Domains** → Select `tipjar.live`
   - Find **Nameservers** or **DNS Settings**
   - Change from Spaceship's nameservers to Vercel's:
     - `ns1.vercel-dns.com`
     - `ns2.vercel-dns.com`
   - Save changes
   - Repeat for `djdash.net`

3. **Wait for Propagation**
   - DNS changes take 24-48 hours to fully propagate
   - Vercel will automatically detect when domains are connected

#### **Option B: Use DNS Records (If Nameservers Not Available)**

If you can't change nameservers, use DNS records:

1. **Get DNS Records from Vercel**
   - When adding domain in Vercel, it will show:
     - **A Record**: `76.76.21.21` (or similar)
     - **CNAME Record**: `cname.vercel-dns.com.` (for www subdomain)

2. **Add Records in Spaceship**
   - Go to DNS Management in Spaceship
   - Add **A Record**:
     - Name: `@` (or root domain)
     - Value: IP address from Vercel
     - TTL: 3600
   - Add **CNAME Record** for www:
     - Name: `www`
     - Value: `cname.vercel-dns.com.`
     - TTL: 3600

### Step 3: Verify Domain Connection

1. **Check Vercel Dashboard**
   - Go to Settings → Domains
   - You should see:
     - ✅ `tipjar.live` - Valid Configuration
     - ✅ `djdash.net` - Valid Configuration
     - ✅ `m10djcompany.com` - Valid Configuration

2. **Test Domains**
   - Visit: `https://tipjar.live` (should show your app)
   - Visit: `https://djdash.net` (should show your app)
   - Visit: `https://m10djcompany.com` (should show your app)

### Step 4: Update Environment Variables

Update your Vercel environment variables:

```env
# Add to Vercel Dashboard → Settings → Environment Variables

NEXT_PUBLIC_TIPJAR_DOMAIN=tipjar.live
NEXT_PUBLIC_DJDASH_DOMAIN=djdash.net
NEXT_PUBLIC_PLATFORM_DOMAIN=m10djcompany.com
```

### Step 5: Configure SSL Certificates

Vercel automatically provisions SSL certificates via Let's Encrypt:
- ✅ Automatic HTTPS
- ✅ Auto-renewal
- ✅ No configuration needed

Just wait for DNS to propagate, and SSL will be active.

---

## 🔍 SEO: Will They Appear as Separate Entities?

### **Yes, they will appear as separate entities** ✅

This is actually **GOOD** for SEO! Here's why:

### Benefits of Separate Domains

1. **Better Keyword Targeting**
   - `tipjar.live` → Targets "tip jar", "song requests", "event tipping"
   - `djdash.net` → Targets "DJ dashboard", "DJ CRM", "DJ business management"
   - `m10djcompany.com` → Targets brand terms, "DJ platform"

2. **Separate Search Rankings**
   - Each domain can rank independently
   - More opportunities to appear in search results
   - Different domains = different search result slots

3. **Domain Authority Building**
   - Each domain builds its own authority
   - Links to tipjar.live help tipjar.live
   - Links to djdash.net help djdash.net
   - No dilution of authority

### Potential SEO Concerns (And How to Fix Them)

#### ⚠️ **Duplicate Content Issue**

If you serve the same content on all three domains, Google might see it as duplicate content.

**Solution: Use Canonical URLs**

```typescript
// utils/seo.ts
export function getCanonicalUrl(path: string, hostname: string) {
  // Determine primary domain based on product
  const product = getProductFromHostname(hostname);
  
  const primaryDomains = {
    tipjar: 'https://tipjar.live',
    djdash: 'https://djdash.net',
    platform: 'https://m10djcompany.com'
  };
  
  // Use the appropriate primary domain for canonical
  const primaryDomain = primaryDomains[product] || primaryDomains.platform;
  
  return `${primaryDomain}${path}`;
}
```

**Implementation:**

```tsx
// app/layout.tsx or pages/_document.js
<Head>
  <link rel="canonical" href={getCanonicalUrl(pathname, hostname)} />
</Head>
```

#### ⚠️ **Cross-Domain Linking**

If you link between domains, use `rel="nofollow"` for non-primary links:

```html
<!-- On tipjar.live, linking to djdash.net -->
<a href="https://djdash.net" rel="nofollow">Upgrade to DJ Dash</a>

<!-- On djdash.net, linking to tipjar.live -->
<a href="https://tipjar.live" rel="nofollow">Try TipJar</a>
```

### Recommended SEO Strategy

#### 1. **Unique Content Per Domain**

- **tipjar.live**: Focus on tip collection, song requests, event features
- **djdash.net**: Focus on business management, CRM, analytics, full suite
- **m10djcompany.com**: Platform hub, comparisons, marketing, blog

#### 2. **Separate Sitemaps**

```xml
<!-- tipjar.live/sitemap.xml -->
<!-- Only include tipjar-relevant pages -->

<!-- djdash.net/sitemap.xml -->
<!-- Only include djdash-relevant pages -->

<!-- m10djcompany.com/sitemap.xml -->
<!-- Marketing pages, blog, comparisons -->
```

#### 3. **Google Search Console Setup**

Set up **separate properties** for each domain:

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property for `tipjar.live`
3. Add property for `djdash.net`
4. Add property for `m10djcompany.com`
5. Submit separate sitemaps for each

#### 4. **Structured Data**

Use domain-specific structured data:

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "TipJar",
  "url": "https://tipjar.live",
  "applicationCategory": "Event Management",
  "offers": {
    "@type": "Offer",
    "price": "29",
    "priceCurrency": "USD"
  }
}
```

### SEO Best Practices

#### ✅ **DO:**

1. **Create unique landing pages** for each domain
2. **Use canonical URLs** to prevent duplicate content
3. **Submit separate sitemaps** to Google Search Console
4. **Build separate backlink profiles** for each domain
5. **Use domain-specific meta descriptions** and titles

#### ❌ **DON'T:**

1. **Don't duplicate identical content** across all three domains
2. **Don't use cross-domain redirects** (301/302) unnecessarily
3. **Don't forget canonical tags** on shared content
4. **Don't use same meta tags** across all domains

---

## 📊 Expected SEO Results

### Timeline

- **Week 1-2**: Domains indexed by Google
- **Month 1-3**: Initial rankings appear
- **Month 3-6**: Domain authority builds
- **Month 6+**: Full SEO benefits realized

### Search Result Examples

**Search: "tip jar app"**
- Result 1: tipjar.live (your domain)
- Result 2: competitor.com
- Result 3: another competitor

**Search: "DJ dashboard"**
- Result 1: competitor.com
- Result 2: djdash.net (your domain)
- Result 3: another competitor

**Search: "M10 DJ Company"**
- Result 1: m10djcompany.com (your brand)
- Result 2: Social media profiles
- Result 3: Reviews/mentions

### Multiple Domains = More Opportunities

Having 3 domains means:
- ✅ 3x more chances to rank
- ✅ 3x more keyword targeting
- ✅ 3x more backlink opportunities
- ✅ Better brand protection

---

## 🚀 Quick Start Checklist

- [ ] Add `tipjar.live` to Vercel project
- [ ] Add `djdash.net` to Vercel project
- [ ] Update nameservers in Spaceship (or add DNS records)
- [ ] Wait 24-48 hours for DNS propagation
- [ ] Verify domains in Vercel dashboard
- [ ] Test HTTPS on both domains
- [ ] Update environment variables
- [ ] Set up Google Search Console for each domain
- [ ] Submit sitemaps to Google
- [ ] Implement canonical URLs
- [ ] Create unique landing pages per domain
- [ ] Set up analytics tracking per domain

---

## 🆘 Troubleshooting

### Domain Not Connecting?

1. **Check DNS Propagation**
   ```bash
   # Check if DNS is resolving
   dig tipjar.live
   dig djdash.net
   ```

2. **Verify Nameservers**
   ```bash
   # Check current nameservers
   dig NS tipjar.live
   dig NS djdash.net
   ```

3. **Check Vercel Status**
   - Go to Vercel Dashboard → Domains
   - Look for error messages
   - Check DNS configuration

### SSL Certificate Issues?

- Vercel auto-provisions SSL
- Wait 24-48 hours after DNS propagation
- Check: https://www.ssllabs.com/ssltest/

### Domain Not Showing in Search?

- Submit sitemap to Google Search Console
- Request indexing in Search Console
- Build backlinks to each domain
- Create unique, valuable content

---

## 📝 Next Steps After Domain Setup

1. **Implement Domain Detection** (from DOMAIN_STRATEGY.md)
2. **Create Product-Specific Landing Pages**
3. **Set Up Analytics** (separate tracking per domain)
4. **Create Unique Content** for each domain
5. **Build Backlinks** to each domain separately

---

**Need Help?** If you run into issues, check:
- Vercel Documentation: https://vercel.com/docs/concepts/projects/domains
- Spaceship DNS Guide: https://help.spaceship.com
- Google Search Console: https://search.google.com/search-console











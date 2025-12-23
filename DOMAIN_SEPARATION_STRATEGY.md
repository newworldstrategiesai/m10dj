# 🌐 Domain Separation Strategy - Public Marketing Sites

## Overview

This guide explains how to keep the public-facing marketing websites completely separated for:
- **`m10djcompany.com`** - Platform marketing site (DJ services, company info)
- **`tipjar.live`** - TipJar product marketing site (tip collection SaaS)
- **`djdash.net`** - DJ Dash product marketing site (full DJ platform SaaS)

## 🏗️ Architecture: Shared Backend, Separate Frontends

### Core Principle

```
┌─────────────────────────────────────────┐
│         Shared Backend (Supabase)      │
│  - Authentication                      │
│  - Database                            │
│  - API Routes                          │
└─────────────────────────────────────────┘
              │
              ├─────────────────┬─────────────────┐
              │                 │                 │
    ┌─────────▼─────────┐ ┌────▼──────┐ ┌───────▼──────┐
    │ m10djcompany.com   │ │tipjar.live│ │ djdash.net   │
    │ Marketing Site     │ │Marketing  │ │ Marketing    │
    │ - DJ Services      │ │Site       │ │ Site         │
    │ - Company Info     │ │- SaaS     │ │ - SaaS       │
    │ - Local SEO        │ │- Pricing  │ │ - Features   │
    └────────────────────┘ └──────────┘ └──────────────┘
```

**Key Points:**
- ✅ All domains share the same backend (Supabase, Stripe, APIs)
- ✅ Each domain has its own marketing pages (homepage, pricing, features)
- ✅ Domain detection routes users to the correct marketing site
- ✅ Shared app pages (admin, requests) work across all domains

---

## 📁 File Structure

### Recommended Structure

```
m10dj/
├── pages/
│   ├── index.js                    # m10djcompany.com homepage
│   ├── about.js                    # m10djcompany.com about
│   ├── services.js                 # m10djcompany.com services
│   └── [slug]/requests.js          # Shared: requests page
│
├── app/
│   ├── (marketing)/
│   │   ├── tipjar/
│   │   │   ├── page.tsx            # tipjar.live homepage
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx        # tipjar.live pricing
│   │   │   ├── features/
│   │   │   │   └── page.tsx        # tipjar.live features
│   │   │   └── how-it-works/
│   │   │       └── page.tsx        # tipjar.live how it works
│   │   │
│   │   └── djdash/
│   │       ├── page.tsx            # djdash.net homepage
│   │       ├── pricing/
│   │       │   └── page.tsx        # djdash.net pricing
│   │       ├── features/
│   │       │   └── page.tsx        # djdash.net features
│   │       └── how-it-works/
│   │           └── page.tsx        # djdash.net how it works
│   │
│   └── admin/                      # Shared: admin dashboard
│
├── components/
│   ├── marketing/
│   │   ├── tipjar/                 # TipJar-specific components
│   │   │   ├── TipJarHero.tsx
│   │   │   ├── TipJarFeatures.tsx
│   │   │   └── TipJarPricing.tsx
│   │   │
│   │   ├── djdash/                 # DJ Dash-specific components
│   │   │   ├── DJDashHero.tsx
│   │   │   ├── DJDashFeatures.tsx
│   │   │   └── DJDashPricing.tsx
│   │   │
│   │   └── m10/                    # M10-specific components
│   │       ├── M10Hero.tsx
│   │       └── M10Services.tsx
│   │
│   └── shared/                     # Shared components
│       ├── Header.tsx
│       └── Footer.tsx
│
└── utils/
    └── domain-detection.ts         # Domain routing logic
```

---

## 🔀 Domain-Based Routing

### Implementation Strategy

#### Option 1: Middleware-Based Routing (Recommended)

Use Next.js middleware to detect the domain and redirect to the appropriate marketing pages.

**`middleware.ts`** (Enhanced):

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getProductConfig } from '@/utils/domain-detection';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  const config = getProductConfig(hostname);

  // Skip middleware for API routes, static files, and admin
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/[slug]/') ||
    pathname.startsWith('/signin') ||
    pathname.startsWith('/signup')
  ) {
    return NextResponse.next();
  }

  // Route marketing pages based on domain
  if (config.product === 'tipjar' && pathname === '/') {
    // tipjar.live homepage -> app/(marketing)/tipjar/page.tsx
    return NextResponse.rewrite(new URL('/tipjar', request.url));
  }

  if (config.product === 'djdash' && pathname === '/') {
    // djdash.net homepage -> app/(marketing)/djdash/page.tsx
    return NextResponse.rewrite(new URL('/djdash', request.url));
  }

  // m10djcompany.com uses pages/index.js (default)
  // No rewrite needed - Pages Router handles it

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### Option 2: Component-Level Detection

Use domain detection in components to conditionally render content.

**Example: `app/(marketing)/tipjar/page.tsx`**

```typescript
import { headers } from 'next/headers';
import { getProductConfig } from '@/utils/domain-detection';
import TipJarHero from '@/components/marketing/tipjar/TipJarHero';
import TipJarFeatures from '@/components/marketing/tipjar/TipJarFeatures';

export default async function TipJarHomePage() {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const config = getProductConfig(hostname);

  // Only show on tipjar.live domain
  if (config.product !== 'tipjar') {
    return <div>This page is only available on tipjar.live</div>;
  }

  return (
    <>
      <TipJarHero />
      <TipJarFeatures />
      {/* ... more TipJar-specific content */}
    </>
  );
}
```

---

## 🎨 Marketing Site Separation

### 1. Homepage Separation

**Current:** `pages/index.js` serves m10djcompany.com

**New Structure:**
- `pages/index.js` → m10djcompany.com (DJ services marketing)
- `app/(marketing)/tipjar/page.tsx` → tipjar.live (SaaS product marketing)
- `app/(marketing)/djdash/page.tsx` → djdash.net (SaaS product marketing)

### 2. SEO & Canonical URLs

Each domain needs its own canonical URLs to prevent duplicate content issues.

**`components/SEO.tsx`** (Enhanced):

```typescript
import { getCanonicalUrl } from '@/utils/domain-detection';

export default function SEO({ 
  title, 
  description, 
  pathname,
  hostname 
}: SEOProps) {
  const canonical = getCanonicalUrl(pathname, hostname);
  
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {/* ... */}
    </Head>
  );
}
```

### 3. Shared vs. Domain-Specific Components

**Shared Components** (used across all domains):
- Header/Footer (with domain-aware branding)
- Authentication flows
- Admin dashboard
- Requests page
- API routes

**Domain-Specific Components**:
- Marketing hero sections
- Feature showcases
- Pricing tables
- Testimonials
- Call-to-action buttons

---

## 🔧 Implementation Steps

### Step 1: Create Marketing Page Structure

```bash
# Create TipJar marketing pages
mkdir -p app/\(marketing\)/tipjar/{pricing,features,how-it-works}
touch app/\(marketing\)/tipjar/page.tsx
touch app/\(marketing\)/tipjar/pricing/page.tsx
touch app/\(marketing\)/tipjar/features/page.tsx
touch app/\(marketing\)/tipjar/how-it-works/page.tsx

# Create DJ Dash marketing pages
mkdir -p app/\(marketing\)/djdash/{pricing,features,how-it-works}
touch app/\(marketing\)/djdash/page.tsx
touch app/\(marketing\)/djdash/pricing/page.tsx
touch app/\(marketing\)/djdash/features/page.tsx
touch app/\(marketing\)/djdash/how-it-works/page.tsx
```

### Step 2: Create Domain-Specific Components

```bash
# TipJar components
mkdir -p components/marketing/tipjar
touch components/marketing/tipjar/TipJarHero.tsx
touch components/marketing/tipjar/TipJarFeatures.tsx
touch components/marketing/tipjar/TipJarPricing.tsx

# DJ Dash components
mkdir -p components/marketing/djdash
touch components/marketing/djdash/DJDashHero.tsx
touch components/marketing/djdash/DJDashFeatures.tsx
touch components/marketing/djdash/DJDashPricing.tsx
```

### Step 3: Update Middleware

Enhance `middleware.ts` to route marketing pages based on domain.

### Step 4: Update Domain Detection

Ensure `utils/domain-detection.ts` correctly identifies each domain.

### Step 5: Create Marketing Content

- **TipJar:** Focus on tip collection, song requests, simplicity
- **DJ Dash:** Focus on full business management, all features
- **M10:** Keep existing DJ services marketing

---

## 🎯 Content Strategy by Domain

### m10djcompany.com (Platform)

**Focus:** Local DJ services, company brand
- Homepage: DJ services, event types, local SEO
- About: Company story, team, Memphis focus
- Services: Wedding DJ, Corporate Events, etc.
- Blog: Event planning tips, DJ industry insights
- Contact: Local booking, phone, email

**SEO Keywords:**
- "Memphis DJ"
- "Wedding DJ Memphis"
- "Corporate Event DJ"
- Local Memphis keywords

### tipjar.live (TipJar Product)

**Focus:** Tip collection SaaS product
- Homepage: "Get Tipped Instantly. Request Songs Easily."
- Features: Song requests, instant payments, embeddable
- Pricing: SaaS pricing tiers
- How It Works: 3-step process
- Blog: Tips for DJs, event management

**SEO Keywords:**
- "tip jar app"
- "song request app"
- "DJ tip collection"
- "event tipping app"

### djdash.net (DJ Dash Product)

**Focus:** Full DJ business platform
- Homepage: "Complete DJ Business Management"
- Features: All features (contacts, contracts, invoices, analytics)
- Pricing: Higher-tier SaaS pricing
- How It Works: Platform overview
- Blog: DJ business management, CRM tips

**SEO Keywords:**
- "DJ business management"
- "DJ CRM"
- "DJ booking software"
- "DJ platform"

---

## 🔒 Access Control

### Feature Gating

Use domain detection to gate features:

```typescript
import { canAccessFeature } from '@/utils/domain-detection';

export default function AdminDashboard() {
  const hostname = headers().get('host') || '';
  
  const canAccessContracts = canAccessFeature('contracts', hostname);
  const canAccessInvoices = canAccessFeature('invoices', hostname);
  
  return (
    <div>
      {canAccessContracts && <ContractsSection />}
      {canAccessInvoices && <InvoicesSection />}
      {/* ... */}
    </div>
  );
}
```

### Marketing Page Access

Prevent cross-domain access to marketing pages:

```typescript
// app/(marketing)/tipjar/page.tsx
export default async function TipJarPage() {
  const hostname = headers().get('host') || '';
  const config = getProductConfig(hostname);
  
  if (config.product !== 'tipjar') {
    redirect('/'); // Redirect to correct domain's homepage
  }
  
  return <TipJarContent />;
}
```

---

## 📊 SEO Considerations

### 1. Separate Sitemaps

Each domain should have its own sitemap:

```typescript
// app/sitemap.ts
export default function sitemap() {
  const hostname = process.env.VERCEL_URL || 'm10djcompany.com';
  const config = getProductConfig(hostname);
  
  if (config.product === 'tipjar') {
    return generateTipJarSitemap();
  }
  
  if (config.product === 'djdash') {
    return generateDJDashSitemap();
  }
  
  return generateM10Sitemap();
}
```

### 2. Canonical URLs

Always use domain-specific canonical URLs:

```typescript
const canonical = getCanonicalUrl(pathname, hostname);
// tipjar.live/pricing → https://tipjar.live/pricing
// djdash.net/pricing → https://djdash.net/pricing
```

### 3. Meta Tags

Domain-specific meta tags:

```typescript
const metaTags = {
  tipjar: {
    title: 'TipJar - Get Tipped Instantly',
    description: 'The simple way to collect tips and song requests',
  },
  djdash: {
    title: 'DJ Dash - Complete DJ Business Management',
    description: 'All-in-one platform for DJ businesses',
  },
  platform: {
    title: 'M10 DJ Company - Memphis DJ Services',
    description: 'Professional DJ services in Memphis',
  },
};
```

---

## 🚀 Deployment Strategy

### Single Vercel Deployment

All three domains point to the same Vercel project:

1. **Add Domains in Vercel:**
   - m10djcompany.com (existing)
   - tipjar.live (add)
   - djdash.net (add)

2. **DNS Configuration:**
   - Each domain has its own CNAME to Vercel
   - Vercel handles SSL certificates automatically

3. **Environment Variables:**
   ```env
   NEXT_PUBLIC_MAIN_DOMAIN=m10djcompany.com
   NEXT_PUBLIC_TIPJAR_DOMAIN=tipjar.live
   NEXT_PUBLIC_DJ_DASH_DOMAIN=djdash.net
   ```

4. **Build Process:**
   - Single build for all domains
   - Middleware routes based on hostname
   - No separate deployments needed

---

## ✅ Checklist

### Setup Complete When:

- [ ] Marketing page structure created (`app/(marketing)/tipjar/`, `app/(marketing)/djdash/`)
- [ ] Domain-specific components created
- [ ] Middleware updated for domain routing
- [ ] Domain detection utility working
- [ ] SEO components use canonical URLs
- [ ] Each domain has its own sitemap
- [ ] Marketing content written for each domain
- [ ] Access control implemented (feature gating)
- [ ] All domains connected in Vercel
- [ ] DNS configured for all domains
- [ ] SSL certificates active
- [ ] Testing: Each domain shows correct marketing site

---

## 🧪 Testing

### Local Testing

```bash
# Test m10djcompany.com (default)
npm run dev
# Visit: http://localhost:3000

# Test tipjar.live (modify /etc/hosts)
# Add: 127.0.0.1 tipjar.live
# Visit: http://tipjar.live:3000

# Test djdash.net (modify /etc/hosts)
# Add: 127.0.0.1 djdash.net
# Visit: http://djdash.net:3000
```

### Production Testing

1. Visit `https://m10djcompany.com` → Should show DJ services marketing
2. Visit `https://tipjar.live` → Should show TipJar SaaS marketing
3. Visit `https://djdash.net` → Should show DJ Dash SaaS marketing
4. Verify canonical URLs are domain-specific
5. Verify sitemaps are separate
6. Verify admin dashboard works on all domains
7. Verify requests pages work on all domains

---

## 📝 Summary

**Key Principles:**
1. **Shared Backend:** All domains use the same Supabase, Stripe, APIs
2. **Separate Marketing:** Each domain has its own marketing pages
3. **Domain Detection:** Middleware routes based on hostname
4. **Feature Gating:** Domain determines available features
5. **SEO Separation:** Each domain has its own sitemap and canonical URLs

**Result:**
- Three distinct marketing sites
- Shared authentication and data
- No duplicate content issues
- Clear product differentiation
- Better SEO for each domain

---

## 🎯 Next Steps

1. **Create marketing page structure** (Step 1 above)
2. **Build TipJar marketing site** (use the design prompt)
3. **Build DJ Dash marketing site** (similar process)
4. **Update middleware** for domain routing
5. **Test locally** with hostname modifications
6. **Deploy and connect domains** in Vercel
7. **Verify SEO** (sitemaps, canonicals, meta tags)

---

**Ready to implement?** Start with creating the marketing page structure and components, then update the middleware for domain-based routing!








# 🌐 Multi-Domain Architecture Strategy

## Overview

You've purchased two strategic domains:
- **`tipjar.live`** - Focused requests/tip collection product
- **`djdash.net`** - Full-featured DJ dashboard platform
- **`m10djcompany.com`** - Main platform/brand (existing)

## Strategic Positioning

### Brand Architecture

```
m10djcompany.com (Platform Brand)
├── tipjar.live (Product Brand - Requests Only)
│   └── Lightweight, focused, embeddable
└── djdash.net (Product Brand - Full Suite)
    └── Complete DJ business management
```

### Recommended Structure

#### **Option A: Product-First Approach** ⭐ RECOMMENDED

**Positioning:**
- `tipjar.live` = Standalone tip/request collection product (can be white-labeled)
- `djdash.net` = Complete DJ business platform (includes tipjar + everything else)
- `m10djcompany.com` = Platform hub, marketing, and embedded experiences

**Benefits:**
- Clear product differentiation
- Better SEO (each domain targets different keywords)
- Easier to sell/position each product separately
- Clients can choose: just tipjar OR full dashboard

**Implementation:**
```
tipjar.live
├── /{slug}/requests (public requests page)
├── /embed/{slug} (embeddable widget)
└── /admin (minimal admin for tipjar-only users)

djdash.net
├── /{slug}/requests (same requests page, but part of full suite)
├── /admin/* (full dashboard)
└── /embed/{slug} (embeddable full dashboard)

m10djcompany.com
├── / (marketing site)
├── /embed/tipjar/{slug} (embeds tipjar.live)
├── /embed/dash/{slug} (embeds djdash.net)
└── /admin (redirects to djdash.net for full users)
```

#### **Option B: Unified Platform Approach**

**Positioning:**
- All domains point to same codebase
- Domain determines feature set/UI
- Single ecosystem, multiple entry points

**Benefits:**
- Simpler maintenance
- Shared authentication
- Unified data

**Drawbacks:**
- Less clear product differentiation
- SEO challenges (duplicate content)

## Recommended Architecture: Hybrid Multi-Tenant

### Technical Implementation

#### 1. **Shared Backend, Domain-Aware Frontend**

```typescript
// Domain detection middleware
const getDomainConfig = (hostname: string) => {
  if (hostname.includes('tipjar.live')) {
    return {
      product: 'tipjar',
      features: ['requests', 'payments', 'basic-analytics'],
      branding: 'tipjar',
      maxFeatures: 'basic'
    };
  }
  
  if (hostname.includes('djdash.net')) {
    return {
      product: 'djdash',
      features: ['requests', 'payments', 'contacts', 'contracts', 'invoices', 'analytics', 'chat'],
      branding: 'djdash',
      maxFeatures: 'full'
    };
  }
  
  // m10djcompany.com - platform hub
  return {
    product: 'platform',
    features: 'all',
    branding: 'm10dj',
    maxFeatures: 'all'
  };
};
```

#### 2. **Domain Routing Strategy**

**For tipjar.live:**
```
/{slug}/requests → Public requests page (lightweight)
/{slug}/embed → Embeddable widget
/admin → Minimal admin (requests, payments, basic settings)
```

**For djdash.net:**
```
/{slug}/requests → Public requests page (full-featured)
/{slug}/embed → Embeddable widget (full dashboard)
/admin/* → Complete dashboard (all features)
```

**For m10djcompany.com:**
```
/ → Marketing site
/pricing → Product comparison
/embed/tipjar/{slug} → Embeds tipjar.live widget
/embed/dash/{slug} → Embeds djdash.net widget
/admin → Redirects to djdash.net (or shows platform admin)
```

#### 3. **White-Label Embedding**

**Client Embedding Options:**

1. **TipJar Embed** (tipjar.live)
   ```html
   <iframe src="https://tipjar.live/embed/{client-slug}" />
   <!-- OR -->
   <iframe src="https://m10djcompany.com/embed/tipjar/{client-slug}" />
   ```

2. **DJ Dash Embed** (djdash.net)
   ```html
   <iframe src="https://djdash.net/embed/{client-slug}" />
   <!-- OR -->
   <iframe src="https://m10djcompany.com/embed/dash/{client-slug}" />
   ```

3. **Custom Domain** (Future)
   ```html
   <iframe src="https://{client-domain}/embed/requests" />
   ```

### Database Schema Updates

```sql
-- Add domain/product configuration to organizations
ALTER TABLE organizations ADD COLUMN product_type TEXT DEFAULT 'djdash';
-- Values: 'tipjar', 'djdash', 'custom'

ALTER TABLE organizations ADD COLUMN custom_domain TEXT;
-- For future white-labeling: client's own domain

ALTER TABLE organizations ADD COLUMN allowed_features JSONB;
-- Feature flags based on product type

-- Example:
-- tipjar: ['requests', 'payments', 'basic_analytics']
-- djdash: ['requests', 'payments', 'contacts', 'contracts', 'invoices', 'analytics', 'chat', 'sms']
```

### Environment Configuration

```env
# Domain Configuration
NEXT_PUBLIC_TIPJAR_DOMAIN=tipjar.live
NEXT_PUBLIC_DJDASH_DOMAIN=djdash.net
NEXT_PUBLIC_PLATFORM_DOMAIN=m10djcompany.com

# Feature Flags
ENABLE_TIPJAR_PRODUCT=true
ENABLE_DJDASH_PRODUCT=true
ENABLE_WHITE_LABEL=true

# CORS for Embedding
ALLOWED_EMBED_ORIGINS=https://m10djcompany.com,https://tipjar.live,https://djdash.net
```

## Implementation Phases

### Phase 1: Domain Detection & Routing (Week 1-2)

1. **Create domain detection middleware**
   - Detect hostname in middleware
   - Set product context
   - Route to appropriate UI

2. **Update Next.js config for multi-domain**
   ```js
   // next.config.js
   module.exports = {
     async rewrites() {
       return [
         {
           source: '/:slug/requests',
           destination: '/requests',
           has: [{ type: 'host', value: 'tipjar.live' }]
         },
         {
           source: '/:slug/requests',
           destination: '/requests',
           has: [{ type: 'host', value: 'djdash.net' }]
         }
       ];
     }
   };
   ```

3. **Create product-specific layouts**
   - `components/layouts/TipJarLayout.tsx`
   - `components/layouts/DJDashLayout.tsx`
   - `components/layouts/PlatformLayout.tsx`

### Phase 2: Feature Gating (Week 2-3)

1. **Feature flag system**
   ```typescript
   // utils/features.ts
   export const getAvailableFeatures = (product: string) => {
     const features = {
       tipjar: ['requests', 'payments', 'basic_analytics'],
       djdash: ['requests', 'payments', 'contacts', 'contracts', 'invoices', 'analytics', 'chat', 'sms'],
       platform: 'all'
     };
     return features[product] || features.djdash;
   };
   ```

2. **Update admin routes**
   - Hide unavailable features in navigation
   - Show upgrade prompts for tipjar users
   - Gate API endpoints by product type

### Phase 3: Embedding Infrastructure (Week 3-4)

1. **Create embed routes**
   - `/embed/{slug}` - Auto-detects product type
   - `/embed/tipjar/{slug}` - Forces tipjar
   - `/embed/dash/{slug}` - Forces djdash

2. **Embed widget components**
   - `components/embed/TipJarWidget.tsx`
   - `components/embed/DJDashWidget.tsx`
   - PostMessage API for communication

3. **CORS & Security**
   - Configure CORS headers
   - X-Frame-Options for embedding
   - Content Security Policy

### Phase 4: White-Labeling (Week 4-5)

1. **Custom domain support**
   - DNS verification
   - SSL certificate management
   - Domain routing

2. **Branding customization**
   - Logo uploads
   - Color schemes
   - Custom CSS

## SEO Strategy

### Domain-Specific SEO

**tipjar.live:**
- Target: "tip jar app", "song request app", "event tipping"
- Focus: Lightweight, fast, embeddable
- Content: Use cases, embedding guides

**djdash.net:**
- Target: "DJ business management", "DJ CRM", "DJ dashboard"
- Focus: Complete solution, professional tools
- Content: Features, integrations, case studies

**m10djcompany.com:**
- Target: "DJ platform", "DJ software", brand terms
- Focus: Platform hub, comparison, marketing
- Content: Product comparison, pricing, blog

### Canonical URLs

```typescript
// Prevent duplicate content issues
const getCanonicalUrl = (path: string, product: string) => {
  const baseUrl = {
    tipjar: 'https://tipjar.live',
    djdash: 'https://djdash.net',
    platform: 'https://m10djcompany.com'
  }[product];
  
  return `${baseUrl}${path}`;
};
```

## Pricing Strategy

### Product Tiers

**TipJar:**
- Free: Basic requests, 10 requests/month
- Pro: $29/month - Unlimited requests, payments, basic analytics
- Embed: $49/month - Embedding + Pro features

**DJ Dash:**
- Starter: $49/month - Requests + Contacts + Basic features
- Pro: $99/month - All features except API
- Enterprise: $199/month - Everything + API + White-label

**Platform (m10djcompany.com):**
- Embedded experiences (free for platform)
- Agency/white-label pricing (custom)

## Migration Path

### For Existing Users

1. **Default to DJ Dash** (full features)
2. **Offer TipJar downgrade** (if they only need requests)
3. **Grandfather pricing** (existing users keep current plan)
4. **Smooth transition** (no data loss, same login)

### For New Users

1. **Landing page** asks: "What do you need?"
   - Just requests → TipJar
   - Full business management → DJ Dash
2. **Onboarding** adapts to product choice
3. **Upgrade path** from TipJar → DJ Dash

## Technical Considerations

### 1. **Shared Authentication**
- Same Supabase project
- Cross-domain session handling
- OAuth redirects per domain

### 2. **Database**
- Single database, product-based feature flags
- Organization-level product assignment
- Shared data (users can access both if subscribed)

### 3. **Deployment**
- Single codebase, multiple Vercel projects
- Environment-based feature flags
- Shared API endpoints

### 4. **Analytics**
- Track by domain/product
- Conversion funnels per product
- Cross-product analytics

## Recommended Next Steps

1. **✅ Validate Strategy** (This document)
2. **🔨 Implement Domain Detection** (Middleware)
3. **🎨 Create Product-Specific UIs** (Layouts)
4. **🔒 Add Feature Gating** (Feature flags)
5. **📦 Build Embed Infrastructure** (Widgets)
6. **🚀 Deploy Multi-Domain** (Vercel config)
7. **📊 Set Up Analytics** (Tracking)
8. **📝 Update Documentation** (User guides)

## Questions to Consider

1. **Should tipjar.live users be able to upgrade to djdash.net?**
   - ✅ Yes - Seamless upgrade path

2. **Can one organization use both products?**
   - ✅ Yes - But they'd have separate accounts/subscriptions

3. **Should m10djcompany.com have its own admin?**
   - ✅ Yes - Platform-level admin for managing all products

4. **How do we handle custom domains?**
   - Phase 2 feature - DNS verification + routing

5. **What about mobile apps?**
   - Future consideration - Same API, different clients

## Success Metrics

- **TipJar Adoption**: # of tipjar.live signups
- **DJ Dash Adoption**: # of djdash.net signups  
- **Embed Usage**: # of embedded widgets
- **Upgrade Rate**: TipJar → DJ Dash conversions
- **Retention**: Product-specific retention rates

---

**This strategy gives you:**
- ✅ Clear product differentiation
- ✅ Flexible embedding options
- ✅ Scalable white-labeling path
- ✅ Better SEO potential
- ✅ Easier product positioning
- ✅ Unified ecosystem


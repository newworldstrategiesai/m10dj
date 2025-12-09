# 🚀 Deployment Strategy: Single vs. Multiple Vercel Projects

## Recommendation: **Single Deployment** ✅

Based on your current architecture, I recommend **one Vercel project** with domain-based routing.

## Why Single Deployment?

### ✅ Advantages

1. **Simpler Maintenance**
   - One codebase to maintain
   - One build process
   - One set of environment variables
   - Easier debugging (single source of truth)

2. **Shared Infrastructure**
   - Same Supabase project
   - Same Stripe account
   - Same database
   - Shared authentication

3. **Cost Effective**
   - One Vercel project (free tier covers most needs)
   - Shared bandwidth
   - Single build time

4. **Easier Feature Gating**
   - Domain detection in middleware (already exists!)
   - Feature flags based on hostname
   - No code duplication

5. **Unified Analytics**
   - Single deployment = easier tracking
   - Cross-domain analytics
   - Unified error monitoring

6. **Faster Development**
   - One git repo
   - One CI/CD pipeline
   - One deployment process

### ❌ Disadvantages (Minor)

1. **Slightly Larger Bundle**
   - Both products in one codebase
   - **Mitigation**: Code splitting + tree shaking removes unused code

2. **Single Point of Deployment**
   - One deployment affects both domains
   - **Mitigation**: Use preview deployments for testing

3. **Shared Environment Variables**
   - Can't have different configs per domain
   - **Mitigation**: Use domain detection + feature flags

## Alternative: Two Deployments

### When to Consider Separate Deployments

Only if:
- ❌ Products have **completely different** tech stacks
- ❌ You need **independent scaling** (very high traffic)
- ❌ You want **separate teams** managing each product
- ❌ Products have **different release cycles** (rare)

### ❌ Disadvantages of Two Deployments

1. **Code Duplication**
   - Shared components need to be synced
   - Bug fixes in two places
   - More maintenance overhead

2. **Complexity**
   - Two Vercel projects to manage
   - Two sets of environment variables
   - Two deployment pipelines
   - Two places to check logs

3. **Shared Resources**
   - Still sharing Supabase/Stripe
   - Need to coordinate database changes
   - Authentication complexity

4. **Cost**
   - Two Vercel projects
   - Potential for duplicate builds
   - More bandwidth usage

## Recommended Architecture: Single Deployment

### Vercel Configuration

```json
// vercel.json
{
  "domains": [
    "m10djcompany.com",
    "www.m10djcompany.com",
    "tipjar.live",
    "www.tipjar.live",
    "djdash.net",
    "www.djdash.net"
  ],
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/:slug/requests",
      "destination": "/requests",
      "has": [
        {
          "type": "host",
          "value": "tipjar.live"
        }
      ]
    },
    {
      "source": "/:slug/requests",
      "destination": "/requests",
      "has": [
        {
          "type": "host",
          "value": "djdash.net"
        }
      ]
    }
  ]
}
```

### Domain Detection in Middleware

```typescript
// middleware.ts (enhance existing)
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Detect product type from domain
  const productConfig = getProductConfig(hostname);
  
  // Add product context to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-product', productConfig.product);
  requestHeaders.set('x-domain', productConfig.domain);
  
  // Continue with existing middleware...
}

function getProductConfig(hostname: string) {
  if (hostname.includes('tipjar.live')) {
    return {
      product: 'tipjar',
      domain: 'tipjar.live',
      features: ['requests', 'payments', 'basic_analytics']
    };
  }
  
  if (hostname.includes('djdash.net')) {
    return {
      product: 'djdash',
      domain: 'djdash.net',
      features: 'all'
    };
  }
  
  return {
    product: 'platform',
    domain: 'm10djcompany.com',
    features: 'all'
  };
}
```

### Environment Variables

```env
# Single set of env vars (shared)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...

# Domain-specific (optional, for analytics)
NEXT_PUBLIC_TIPJAR_DOMAIN=tipjar.live
NEXT_PUBLIC_DJDASH_DOMAIN=djdash.net
NEXT_PUBLIC_PLATFORM_DOMAIN=m10djcompany.com

# Feature flags
ENABLE_TIPJAR_PRODUCT=true
ENABLE_DJDASH_PRODUCT=true
```

### Code Structure

```
/
├── app/
│   ├── (platform)/          # m10djcompany.com pages
│   ├── (tipjar)/            # tipjar.live pages
│   └── (djdash)/            # djdash.net pages
├── components/
│   ├── layouts/
│   │   ├── PlatformLayout.tsx
│   │   ├── TipJarLayout.tsx
│   │   └── DJDashLayout.tsx
│   └── features/
│       ├── requests/        # Shared component
│       ├── payments/        # Shared component
│       └── admin/           # Product-specific
├── utils/
│   ├── domain-detection.ts  # Domain → product mapping
│   └── feature-flags.ts     # Feature gating
└── middleware.ts            # Domain routing
```

## Implementation Steps

### Step 1: Update Vercel Project

1. **Add Domains to Vercel**
   - Go to Vercel Dashboard → Project Settings → Domains
   - Add: `tipjar.live`, `www.tipjar.live`
   - Add: `djdash.net`, `www.djdash.net`
   - Keep: `m10djcompany.com`, `www.m10djcompany.com`

2. **Configure DNS**
   - Point both domains to Vercel's nameservers
   - Or use CNAME records to Vercel

### Step 2: Enhance Middleware

```typescript
// middleware.ts - Add to existing
const product = getProductFromHostname(hostname);
requestHeaders.set('x-product', product);
```

### Step 3: Create Product Layouts

```typescript
// app/layout.tsx
const product = headers().get('x-product') || 'platform';

return (
  <ProductProvider product={product}>
    {product === 'tipjar' && <TipJarLayout>}
    {product === 'djdash' && <DJDashLayout>}
    {product === 'platform' && <PlatformLayout>}
  </ProductProvider>
);
```

### Step 4: Feature Gating

```typescript
// utils/features.ts
export function canAccessFeature(feature: string, product: string) {
  const features = {
    tipjar: ['requests', 'payments', 'basic_analytics'],
    djdash: ['requests', 'payments', 'contacts', 'contracts', 'invoices', 'analytics', 'chat'],
    platform: 'all'
  };
  
  const allowed = features[product] || features.djdash;
  return allowed === 'all' || allowed.includes(feature);
}
```

## Performance Considerations

### Code Splitting

Next.js automatically code-splits, but you can optimize:

```typescript
// Lazy load product-specific components
const TipJarAdmin = dynamic(() => import('@/components/admin/TipJarAdmin'));
const DJDashAdmin = dynamic(() => import('@/components/admin/DJDashAdmin'));
```

### Bundle Size

- **Shared code**: ~200KB (React, Next.js, shared components)
- **TipJar-specific**: ~50KB (minimal admin)
- **DJ Dash-specific**: ~150KB (full admin)
- **Total**: ~400KB (vs. 2x ~350KB = 700KB with separate deployments)

**Result**: Single deployment is actually **smaller** due to shared code!

## Monitoring & Analytics

### Single Deployment Benefits

```typescript
// utils/analytics.ts
export function trackEvent(event: string, product?: string) {
  const detectedProduct = getProductFromHostname(window.location.hostname);
  const productToTrack = product || detectedProduct;
  
  // Track with product context
  gtag('event', event, {
    product: productToTrack,
    domain: window.location.hostname
  });
}
```

## Deployment Workflow

### Single Deployment Process

```bash
# 1. Make changes
git commit -m "Add feature X"

# 2. Push to main
git push origin main

# 3. Vercel auto-deploys
# - Builds once
# - Deploys to all domains
# - All domains get same code
```

### Testing Strategy

```bash
# Preview deployments (per PR)
vercel --prod=false  # Creates preview URL

# Test each domain:
# - tipjar.live (preview)
# - djdash.net (preview)
# - m10djcompany.com (preview)

# Production deployment
git push origin main  # Auto-deploys to all domains
```

## When to Split Later

Consider separate deployments **only if**:

1. **Traffic Explodes**
   - TipJar: 100K+ requests/day
   - DJ Dash: 100K+ requests/day
   - Need independent scaling

2. **Different Release Cycles**
   - TipJar: Weekly releases
   - DJ Dash: Monthly releases
   - (Unlikely with shared backend)

3. **Team Structure Changes**
   - Separate teams per product
   - Different tech stacks needed

## Recommendation Summary

### ✅ **Start with Single Deployment**

**Why:**
- Simpler to maintain
- Faster development
- Lower cost
- Easier to share code
- Your middleware already supports it!

**When to Revisit:**
- If traffic exceeds Vercel limits
- If products diverge significantly
- If you need independent scaling

### Migration Path

If you later need separate deployments:
1. Create new Vercel project
2. Point one domain to new project
3. Keep shared code in monorepo
4. Gradually migrate

## Next Steps

1. ✅ **Keep single deployment** (recommended)
2. 🔧 **Add domains to Vercel project**
3. 🔧 **Enhance middleware** for domain detection
4. 🎨 **Create product-specific layouts**
5. 🔒 **Implement feature gating**
6. 🚀 **Deploy and test**

---

**Bottom Line**: Single deployment is the right choice for your use case. You can always split later if needed, but starting with one deployment will save you significant time and complexity.


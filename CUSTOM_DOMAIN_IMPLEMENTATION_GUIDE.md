# 🌐 Custom Domain Implementation Guide

## Overview

This guide outlines what it would take to allow SaaS users to set up custom domain names for their white-label instances. This is a premium feature typically reserved for Enterprise tier customers.

---

## ✅ Current State

### What Already Exists

1. **Database Schema** ✅
   - `organizations.custom_domain` field exists (TEXT, nullable)
   - Index created: `idx_organizations_custom_domain`
   - Migration: `20250125000001_add_white_label_branding.sql`

2. **Organization Structure** ✅
   - Organizations table with `slug` for subdomain routing
   - White-label branding system in place
   - Enterprise tier subscription model

3. **Infrastructure** ✅
   - Next.js application on Vercel
   - Supabase for database
   - Middleware system in place

---

## 🚧 What Needs to Be Built

### 1. Domain Management System

#### A. Database Enhancements

**Add domain verification fields:**
```sql
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_domain_verification_token TEXT,
ADD COLUMN IF NOT EXISTS custom_domain_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS custom_domain_dns_records JSONB; -- Store required DNS records

-- Index for domain lookups
CREATE INDEX IF NOT EXISTS idx_organizations_custom_domain_verified 
ON organizations(custom_domain) 
WHERE custom_domain IS NOT NULL AND custom_domain_verified = TRUE;
```

**Why needed:**
- Verify users own the domain before activation
- Store DNS configuration for user guidance
- Track verification status

#### B. Domain Validation API

**Create endpoint:** `/api/organizations/verify-domain`

**Functionality:**
1. Generate verification token (TXT record value)
2. Store token in database
3. Provide DNS instructions to user
4. Periodically check DNS records for verification
5. Activate domain when verified

**Example flow:**
```typescript
// 1. User enters domain: "requests.djname.com"
// 2. Generate token: "m10dj-verify-abc123xyz"
// 3. User adds TXT record: _m10dj-verify.djname.com → "m10dj-verify-abc123xyz"
// 4. System checks DNS every 5 minutes
// 5. When found, mark as verified and activate
```

---

### 2. Middleware Enhancement

**Current middleware** (`middleware.ts`) only adds pathname to headers.

**New functionality needed:**

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Skip for API routes, static files, etc.
  if (url.pathname.startsWith('/api') || 
      url.pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Check if this is a custom domain
  const customDomain = await getOrganizationByCustomDomain(hostname);
  
  if (customDomain) {
    // Set organization context for this request
    const headers = new Headers(request.headers);
    headers.set('x-organization-id', customDomain.id);
    headers.set('x-custom-domain', 'true');
    
    return NextResponse.next({
      request: {
        headers: headers,
      },
    });
  }

  // Default behavior (existing code)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

async function getOrganizationByCustomDomain(hostname: string) {
  // Query Supabase for organization with matching custom_domain
  // Only return if verified
}
```

**Key considerations:**
- Cache domain lookups (Redis or in-memory cache)
- Handle www vs non-www variants
- Support subdomains (e.g., `requests.djname.com`)

---

### 3. Vercel Domain Configuration

#### A. Wildcard Domain Setup

**Option 1: Wildcard Domain (Recommended)**
- Configure Vercel to accept any domain pointing to your project
- Requires Vercel Pro plan ($20/month) for wildcard domains
- Automatic SSL via Let's Encrypt

**Configuration:**
```json
// vercel.json
{
  "domains": ["*.yourplatform.com"], // For subdomains
  // Custom domains handled via Vercel API
}
```

**Option 2: Manual Domain Addition**
- Users provide domain → You add via Vercel API
- More control, but requires automation
- Still needs Vercel Pro for multiple domains

#### B. Vercel API Integration

**Create service:** `utils/vercel-domains.ts`

```typescript
// Add domain to Vercel project
async function addDomainToVercel(domain: string) {
  const response = await fetch(
    `https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    }
  );
  return response.json();
}
```

**Requirements:**
- Vercel API token (from account settings)
- Project ID from Vercel
- Handle domain conflicts and errors

---

### 4. DNS Verification System

#### A. DNS Record Checking

**Create utility:** `utils/dns-verification.ts`

```typescript
import dns from 'dns/promises';

async function verifyDNSRecord(domain: string, token: string): Promise<boolean> {
  try {
    const records = await dns.resolveTxt(`_m10dj-verify.${domain}`);
    const found = records.some(record => 
      record.some(line => line.includes(token))
    );
    return found;
  } catch (error) {
    return false;
  }
}
```

**Alternative:** Use external DNS API service:
- Cloudflare API (if using Cloudflare)
- AWS Route53 API
- Google Cloud DNS API
- Or use a service like `dns-js` npm package

#### B. Background Job for Verification

**Create API route:** `/api/cron/verify-custom-domains`

**Schedule:** Every 5-10 minutes (via Vercel Cron)

```typescript
// Check all pending domain verifications
// Update status when DNS records are found
// Send email notification when verified
```

---

### 5. User Interface

#### A. Admin Settings Page

**Location:** `/admin/settings/custom-domain` or `/admin/branding`

**Components needed:**
1. **Domain Input Form**
   - Text input for custom domain
   - Validation (format, availability)
   - Submit button

2. **DNS Instructions Display**
   - Show required DNS records
   - Copy-paste friendly format
   - Visual guide/instructions

3. **Verification Status**
   - Pending/Verifying/Verified states
   - Last check timestamp
   - Error messages if verification fails

4. **Active Domain Display**
   - Show current active domain
   - Option to change/remove
   - SSL status indicator

**Example UI Flow:**
```
┌─────────────────────────────────────┐
│ Custom Domain Configuration         │
├─────────────────────────────────────┤
│ Enter your custom domain:           │
│ [requests.djname.com        ] [Add] │
│                                     │
│ Status: ⏳ Verifying...             │
│                                     │
│ Add this DNS record:                │
│ Type: TXT                           │
│ Name: _m10dj-verify                 │
│ Value: m10dj-verify-abc123xyz       │
│                                     │
│ [Copy DNS Record]                   │
└─────────────────────────────────────┘
```

#### B. Update Existing Branding Component

**File:** `components/admin/WhiteLabelBranding.tsx`

Add custom domain section to existing branding UI.

---

### 6. Organization Context Updates

**Update:** `utils/organization-context.ts`

**Add function:**
```typescript
export async function getOrganizationByCustomDomain(
  supabase: SupabaseClient,
  domain: string
): Promise<Organization | null> {
  // Normalize domain (remove www, lowercase, etc.)
  const normalized = normalizeDomain(domain);
  
  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('custom_domain', normalized)
    .eq('custom_domain_verified', true)
    .single();

  return org as Organization | null;
}
```

**Update all pages/components** to use custom domain context when present.

---

### 7. URL Generation Updates

**Update all URL generation** to use custom domain when available:

```typescript
// utils/url-helpers.ts
export function getOrganizationUrl(org: Organization): string {
  if (org.custom_domain && org.custom_domain_verified) {
    return `https://${org.custom_domain}`;
  }
  // Fallback to subdomain or default
  return `https://${org.slug}.yourplatform.com`;
}
```

**Files to update:**
- Email templates
- QR code generation
- Share links
- Sitemap generation
- Social media links

---

## 🔧 Infrastructure Requirements

### 1. Vercel Plan

**Minimum:** Vercel Pro ($20/month)
- Required for:
  - Multiple custom domains
  - Wildcard domain support (optional)
  - Higher rate limits for API

**Alternative:** Vercel Enterprise
- Unlimited domains
- Better support
- Custom pricing

### 2. DNS Service (Optional)

If you want to automate DNS management:
- **Cloudflare** (recommended)
  - Free tier available
  - API for DNS management
  - Fast propagation
- **AWS Route53**
  - Pay per query
  - Full API control
- **Google Cloud DNS**
  - Similar to Route53

**Note:** Most users will manage DNS themselves, so this is optional.

### 3. Domain Verification Service

**Options:**
1. **Self-hosted** (recommended for MVP)
   - Use Node.js `dns` module
   - Simple and free
   - May have rate limits

2. **Third-party service**
   - DNSimple API
   - Namecheap API
   - More reliable, but costs money

### 4. Caching Layer (Recommended)

**For performance:**
- Cache domain → organization lookups
- Use Vercel Edge Config or Redis
- Reduces database queries

**Example:**
```typescript
// Cache domain lookups for 5 minutes
const cacheKey = `domain:${hostname}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation (Week 1)

- [ ] Add database fields for domain verification
- [ ] Create domain validation utility functions
- [ ] Build DNS verification API endpoint
- [ ] Create background job for periodic verification checks

### Phase 2: Middleware & Routing (Week 1-2)

- [ ] Update middleware to detect custom domains
- [ ] Implement organization lookup by domain
- [ ] Add caching for domain lookups
- [ ] Test routing with custom domains

### Phase 3: Vercel Integration (Week 2)

- [ ] Set up Vercel API integration
- [ ] Create service to add domains via API
- [ ] Handle domain conflicts and errors
- [ ] Test SSL certificate provisioning

### Phase 4: User Interface (Week 2-3)

- [ ] Create custom domain settings page
- [ ] Build DNS instructions component
- [ ] Add verification status display
- [ ] Integrate with existing branding UI

### Phase 5: URL Updates (Week 3)

- [ ] Update all URL generation to use custom domains
- [ ] Fix email templates
- [ ] Update QR code generation
- [ ] Fix sitemap generation

### Phase 6: Testing & Polish (Week 4)

- [ ] End-to-end testing with real domains
- [ ] Error handling and edge cases
- [ ] Documentation for users
- [ ] Support documentation

---

## 💰 Cost Breakdown

### Monthly Costs

1. **Vercel Pro Plan:** $20/month
   - Required for multiple custom domains
   - Automatic SSL certificates

2. **Optional Services:**
   - **Redis** (for caching): $0-10/month (Vercel KV free tier available)
   - **DNS API service:** $0-50/month (if using third-party)
   - **Monitoring:** $0-20/month (Sentry, LogRocket, etc.)

**Total:** ~$20-100/month depending on scale

### One-Time Costs

- Development time: 3-4 weeks
- Testing domains: $10-15/year per test domain
- Documentation: 1-2 days

---

## 🚨 Important Considerations

### 1. Domain Ownership Verification

**Critical security requirement:**
- Must verify users own domains before activation
- Prevents domain hijacking
- Use TXT record verification (industry standard)

### 2. SSL Certificate Management

**Vercel handles this automatically:**
- Let's Encrypt certificates
- Automatic renewal
- No manual configuration needed

### 3. DNS Propagation

**User education needed:**
- DNS changes can take 24-48 hours
- Provide clear instructions
- Show helpful error messages during wait time

### 4. Domain Conflicts

**Handle edge cases:**
- Multiple users want same domain
- Domain already in use
- Invalid domain formats
- Expired domains

### 5. Subdomain vs Root Domain

**Support both:**
- `requests.djname.com` (subdomain) - easier for users
- `djname.com` (root) - more professional, but requires root domain setup

**Recommendation:** Start with subdomain support, add root domain later.

### 6. Fallback Behavior

**When custom domain fails:**
- Fallback to subdomain: `{slug}.yourplatform.com`
- Show error message
- Log issues for support

### 7. Rate Limiting

**DNS verification:**
- Don't check too frequently (every 5-10 minutes is fine)
- Cache results
- Respect DNS provider rate limits

---

## 📚 User Documentation Needed

### For End Users

1. **How to Add Custom Domain**
   - Step-by-step guide
   - Screenshots
   - Video tutorial (optional)

2. **DNS Configuration Guide**
   - How to add TXT records
   - Common DNS providers (GoDaddy, Namecheap, Cloudflare)
   - Troubleshooting

3. **Verification Process**
   - What to expect
   - How long it takes
   - What to do if it fails

### For Support Team

1. **Troubleshooting Guide**
   - Common issues
   - How to verify DNS records manually
   - When to escalate

---

## 🎯 Success Metrics

### Technical Metrics
- Domain verification success rate (target: >95%)
- Average verification time (target: <24 hours)
- SSL certificate provisioning time (target: <5 minutes)
- Domain lookup performance (target: <100ms)

### Business Metrics
- Adoption rate among Enterprise customers
- Support tickets related to domains
- Customer satisfaction with feature

---

## 🚀 Quick Start Implementation

### Minimum Viable Product (MVP)

**For initial launch, you can simplify:**

1. **Manual Domain Addition**
   - Users provide domain → You add via Vercel dashboard manually
   - Skip API automation initially
   - Add automation later

2. **Simple Verification**
   - User adds TXT record
   - You verify manually or via simple script
   - Activate when verified

3. **Basic UI**
   - Simple form to enter domain
   - Show DNS instructions
   - Status indicator

**This reduces complexity by ~60% while still providing value.**

---

## 🔗 Related Files to Update

### Database
- `supabase/migrations/` - Add domain verification fields
- `types_db.ts` - Update TypeScript types

### Middleware
- `middleware.ts` - Add domain detection
- `utils/organization-context.ts` - Add domain lookup

### API Routes
- `pages/api/organizations/verify-domain.ts` - New
- `pages/api/cron/verify-custom-domains.ts` - New
- `pages/api/organizations/branding/update.ts` - Update

### Components
- `components/admin/WhiteLabelBranding.tsx` - Add domain section
- `components/admin/CustomDomainSettings.tsx` - New

### Utilities
- `utils/dns-verification.ts` - New
- `utils/vercel-domains.ts` - New
- `utils/url-helpers.ts` - New/Update

---

## 📞 Next Steps

1. **Validate demand** - Survey Enterprise customers
2. **Choose approach** - MVP vs full automation
3. **Set up Vercel Pro** - Required for multiple domains
4. **Build MVP** - Start with manual process
5. **Test with beta users** - Get feedback
6. **Automate** - Add API integration
7. **Launch** - Make available to all Enterprise customers

---

## 🎉 Conclusion

Custom domain support is a **valuable premium feature** that significantly enhances white-label capabilities. The implementation is **moderately complex** but achievable with:

- ✅ 3-4 weeks of development time
- ✅ Vercel Pro plan ($20/month)
- ✅ Good documentation for users
- ✅ Proper DNS verification system

**Estimated development effort:** 120-160 hours

**Recommended approach:** Start with MVP (manual process), then automate based on user feedback.



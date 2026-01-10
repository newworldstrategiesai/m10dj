# 🎯 TipJar.live Embed Feature Implementation Strategy

## Executive Summary

This strategy outlines the implementation plan for the embed feature on **TipJar.live**. The embed feature allows DJs to embed song request forms and tip collection widgets into their own websites.

**Focus: TipJar.live 100%**

**Current State:**
- ✅ Basic embed route exists: `/[slug]/embed/requests`
- ✅ EmbedCodeGenerator component exists
- ✅ Feature gating for embed widgets (Embed Pro tier required)
- ⚠️ Missing: Security headers, postMessage API, white-label support, analytics tracking

---

## 1. Feature Summary

### 1.1 Core Functionality

**What Users Get:**
- Copy-paste embed code for their website
- Customizable embed options (theme, height, border radius)
- Responsive iframe widget
- White-label option (remove branding) for Embed Pro tier
- Real-time preview in admin dashboard

**What Websites Can Embed:**
- Song request forms
- Tip collection interface
- Event-specific widgets (future enhancement)

### 1.2 Embed Types

**Type 1: Basic Iframe Embed** (All tiers)
```html
<iframe 
  src="https://tipjar.live/{slug}/embed/requests?theme=light"
  width="100%" 
  height="800" 
  frameborder="0"
></iframe>
```

**Type 2: Responsive Iframe Embed** (All tiers)
```html
<div style="position: relative; padding-bottom: 100%; height: 0;">
  <iframe 
    src="https://tipjar.live/{slug}/embed/requests"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
  ></iframe>
</div>
```

**Type 3: Script Tag Embed** (Future - Phase 3)
```html
<script src="https://tipjar.live/embed.js" data-slug="{slug}" data-theme="light"></script>
```

---

## 2. TipJar.live Embed Scope & Security

### 2.1 TipJar.live Embed Behavior

**Core Features:**
- Lightweight song request + tipping widget
- Minimal branding (can be removed on Embed Pro tier)
- Fast load times (< 2s target)
- Mobile-first responsive design
- Domain: `tipjar.live/{slug}/embed/requests`

**Target Use Cases:**
- DJ websites embedding request form
- Event pages with embedded tipping
- Social media bio links (redirect to embed)
- QR codes linking to embed page

### 2.2 Critical Security Risks ⚠️

**CRITICAL:** Embeds share the same database and authentication layer as the main platform.

**Key Risks:**
1. **Data Leakage:** Organization A's embed showing Organization B's data
2. **Payment Security:** Tips/payments must be scoped to correct organization
3. **Subscription Enforcement:** Non-Embed Pro users accessing embed features
4. **Rate Limiting:** Embeds from different origins need proper rate limiting
5. **XSS Attacks:** Malicious query parameters or user input

**Mitigation Strategy:**
- ✅ Always verify `slug` belongs to organization (server-side validation)
- ✅ Enforce subscription tier checks on embed routes (Embed Pro required)
- ✅ Implement origin-based rate limiting (100 req/min per IP)
- ✅ Use organization_id in ALL database queries (never trust client)
- ✅ Audit logs for all embed interactions
- ✅ Input sanitization for all query params and user input
- ✅ CORS restrictions (allowlist specific domains if needed)

---

## 3. Implementation Phases

### Phase 1: Foundation & Security (Week 1) 🔥 CRITICAL

**Goal:** Secure, working embed routes with proper headers

#### 3.1 Security Headers Implementation

**Files to Create/Modify:**
- `utils/embed-security.ts` (new)
- `middleware.ts` (modify)
- `pages/[slug]/embed/requests.js` (modify)
- `next.config.js` (modify)

**Required Headers:**
```typescript
// For TipJar.live embed routes ONLY
// Use CSP frame-ancestors (preferred over X-Frame-Options)
Content-Security-Policy: frame-ancestors *;  // Allow embedding from any origin
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: ALLOWALL  // Legacy support (use CSP instead)
```

**CORS Configuration:**
```typescript
// For TipJar.live embeds - allow embedding from any origin
// (Restrict if needed for security, but embeds are meant to be public)
Access-Control-Allow-Origin: *  // Or specific allowlist
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: Content-Type, Authorization
```

#### 3.2 Embed Route Security

**Verify:**
1. Slug exists and is active
2. Organization has active subscription
3. Organization has embed feature access (Embed Pro tier)
4. Rate limiting per origin
5. Input sanitization for all query params

**Implementation:**
```typescript
// utils/embed-security.ts
export async function validateTipJarEmbedAccess(
  slug: string,
  origin: string | null
): Promise<{ allowed: boolean; reason?: string; organization?: any }> {
  // 1. Verify organization exists and is active
  // 2. Check subscription tier (must be Embed Pro / enterprise for embeds)
  // 3. Verify organization is for TipJar product (product_id check)
  // 4. Check rate limits per origin/IP
  // 5. Return organization data if allowed
  
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  
  if (!org) {
    return { allowed: false, reason: 'Organization not found' };
  }
  
  // Check subscription tier (Embed Pro = enterprise tier in TipJar)
  const hasEmbedAccess = canUseEmbedWidget(org.subscription_tier, org.subscription_status);
  if (!hasEmbedAccess.allowed) {
    return { allowed: false, reason: hasEmbedAccess.reason };
  }
  
  // Check rate limits (per IP/origin)
  const rateLimited = await checkEmbedRateLimit(slug, origin);
  if (rateLimited) {
    return { allowed: false, reason: 'Rate limit exceeded. Please try again later.' };
  }
  
  return { allowed: true, organization: org };
}
```

#### 3.3 TipJar.live Embed URL Generation

**Current:** `/{slug}/embed/requests`
**Enhanced:** Support query parameters and customization

```typescript
// utils/embed-urls.ts
export function getTipJarEmbedUrl(
  slug: string,
  options?: { 
    theme?: 'light' | 'dark' | 'auto';
    eventCode?: string;
    height?: number;
    primaryColor?: string;
    borderRadius?: number;
    hideBranding?: boolean;
  }
): string {
  const baseUrl = 'https://tipjar.live';
  const params = new URLSearchParams();
  
  if (options?.theme) params.set('theme', options.theme);
  if (options?.eventCode) params.set('event', options.eventCode);
  if (options?.primaryColor) params.set('primaryColor', options.primaryColor);
  if (options?.borderRadius) params.set('borderRadius', String(options.borderRadius));
  if (options?.hideBranding) params.set('hideBranding', 'true');
  
  return `${baseUrl}/${slug}/embed/requests?${params.toString()}`;
}
```

**Deliverables:**
- [ ] Security headers middleware for embed routes
- [ ] CORS configuration (allow all origins for TipJar embeds)
- [ ] TipJar embed access validation function
- [ ] TipJar embed URL generation utility
- [ ] Rate limiting for embed endpoints (100 req/min per IP)
- [ ] Security audit checklist

**Estimated Time:** 3-4 days

---

### Phase 2: Enhanced Embed Widget (Week 2)

**Goal:** Feature-complete embed widget with customization

#### 2.1 Embed Widget Component Enhancement

**Files to Modify:**
- `pages/[slug]/embed/requests.js` (enhance)
- `components/embed/EmbedWidget.tsx` (new - reusable)
- `pages/requests.js` (ensure embedMode works correctly)

**Features:**
1. **Theme Support** (light/dark/auto)
2. **Height Auto-Adjustment** (postMessage to parent)
3. **Custom Styling** (query params: `?primaryColor=#6366f1&borderRadius=12`)
4. **Event-Specific Mode** (show only active event requests)
5. **Branding Toggle** (show/hide "Powered by TipJar" - Embed Pro only)

**Query Parameters:**
```
?theme=light|dark|auto
?height=800 (fixed) | auto (responsive)
?event={eventCode}
?primaryColor={hex}
?borderRadius={px}
?hideBranding=true (Embed Pro only)
```

#### 2.2 PostMessage API

**Purpose:** Enable communication between embed and parent window

**Messages from Embed → Parent:**
```typescript
// Height change notification
{ type: 'height-change', height: 850 }

// Request submitted
{ type: 'request-submitted', requestId: '123' }

// Payment completed
{ type: 'payment-completed', amount: 10.00 }

// Error occurred
{ type: 'error', message: 'Failed to submit request' }
```

**Messages from Parent → Embed:**
```typescript
// Request embed dimensions
{ type: 'request-dimensions' }

// Set theme
{ type: 'set-theme', theme: 'dark' }

// Reload data
{ type: 'reload' }
```

**Implementation:**
```typescript
// components/embed/postMessage.ts
export function setupPostMessageAPI(
  embedWindow: Window,
  allowedOrigins: string[]
) {
  window.addEventListener('message', (event) => {
    // Verify origin
    if (!allowedOrigins.includes(event.origin)) return;
    
    // Handle parent messages
    handleParentMessage(event.data);
  });
  
  // Send messages to parent
  function sendToParent(message: any) {
    embedWindow.parent.postMessage(message, '*'); // In production, specify origin
  }
}
```

#### 2.3 Embed Code Generator Enhancement

**Files to Modify:**
- `components/onboarding/EmbedCodeGenerator.tsx` (enhance)
- `pages/admin/embed-settings.tsx` (new - dedicated embed settings page)

**New Features:**
1. **Live Preview** (real iframe preview in admin)
2. **Multiple Embed Types** (standard, responsive, script tag)
3. **Platform-Specific Instructions** (WordPress, Wix, Squarespace)
4. **Custom CSS Injection** (Embed Pro only)
5. **Analytics Preview** (show embed usage stats)

**UI Enhancements:**
- Tabbed interface: Standard | Responsive | Script Tag
- Color picker for primary color
- Slider for height/border radius
- Toggle for branding visibility
- Copy button with success feedback
- Preview pane with iframe

**Deliverables:**
- [ ] Enhanced embed widget component
- [ ] PostMessage API implementation
- [ ] Theme customization system
- [ ] Improved embed code generator UI
- [ ] Admin embed settings page
- [ ] Documentation for query parameters

**Estimated Time:** 4-5 days

---

### Phase 3: White-Label & Advanced Features (Week 3)

**Goal:** Enterprise features for Embed Pro tier

#### 3.1 White-Label Support

**Files to Create/Modify:**
- `utils/white-label.ts` (new)
- `pages/[slug]/embed/requests.js` (modify - check white-label access)
- `components/embed/EmbedWidget.tsx` (modify - conditional branding)
- Database: `organizations` table (add `custom_css`, `embed_branding_disabled`)

**Features:**
1. **Remove "Powered by TipJar"** (Embed Pro only)
2. **Custom CSS Injection** (Embed Pro only)
3. **Custom Logo** (Embed Pro only - future)
4. **Custom Domain Support** (Enterprise - future)

**Database Schema:**
```sql
ALTER TABLE organizations ADD COLUMN embed_custom_css TEXT;
ALTER TABLE organizations ADD COLUMN embed_branding_disabled BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN embed_custom_logo_url TEXT;
```

**Implementation:**
```typescript
// utils/white-label.ts
export function getEmbedBrandingConfig(organization: any) {
  const canWhiteLabel = canUseWhiteLabel(organization.subscription_tier, organization.subscription_status);
  
  return {
    showBranding: !canWhiteLabel.allowed || !organization.embed_branding_disabled,
    customCSS: canWhiteLabel.allowed ? organization.embed_custom_css : null,
    customLogo: canWhiteLabel.allowed ? organization.embed_custom_logo_url : null,
  };
}
```

#### 3.2 Analytics & Tracking

**Files to Create:**
- `utils/embed-analytics.ts` (new)
- Database: `embed_analytics` table (new)

**Track:**
- Embed views (per organization, per day)
- Embed interactions (requests submitted, payments)
- Referrer domains (which websites are embedding)
- Performance metrics (load time, errors)

**Database Schema:**
```sql
CREATE TABLE embed_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  embed_type TEXT, -- 'requests', 'dashboard', etc.
  view_date DATE,
  view_count INTEGER DEFAULT 0,
  interaction_count INTEGER DEFAULT 0,
  referrer_domain TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_embed_analytics_org_date ON embed_analytics(organization_id, view_date);
```

**Implementation:**
```typescript
// Track embed view on page load
export async function trackEmbedView(
  organizationId: string,
  embedType: string,
  referrer?: string
) {
  // Increment view count for today
  // Store referrer domain
  // Update analytics table
}
```

#### 3.3 Script Tag Embed (Alternative to Iframe)

**Files to Create:**
- `public/embed.js` (new - standalone script)
- `pages/api/embed/config/[slug].js` (new - config endpoint)

**Benefits:**
- No iframe overhead
- Better SEO
- Easier styling integration
- Faster load times

**Implementation:**
```javascript
// public/embed.js
(function() {
  const script = document.currentScript;
  const slug = script.dataset.slug;
  const theme = script.dataset.theme || 'light';
  
  // Fetch config
  fetch(`https://tipjar.live/api/embed/config/${slug}?theme=${theme}`)
    .then(res => res.json())
    .then(config => {
      // Render widget into target element
      renderWidget(config);
    });
})();
```

**Deliverables:**
- [ ] White-label branding removal
- [ ] Custom CSS injection
- [ ] Embed analytics tracking
- [ ] Analytics dashboard UI
- [ ] Script tag embed option
- [ ] Performance optimization

**Estimated Time:** 5-6 days

---

### Phase 4: Testing, Optimization & Launch Prep (Week 4)

**Goal:** Comprehensive testing, performance optimization, and launch readiness

#### 4.1 Comprehensive Testing

**Test Scenarios:**
1. Embed loads with valid slug and Embed Pro subscription
2. Embed rejects invalid slug
3. Embed rejects non-Embed Pro subscriptions
4. Embed respects white-label settings
5. PostMessage communication works correctly
6. Analytics tracking captures all events
7. Payment flow works seamlessly in embed
8. Mobile responsiveness across devices
9. Theme switching works
10. Custom CSS injection works (Embed Pro)

**Files to Create:**
- `__tests__/embed/security.test.ts`
- `__tests__/embed/widget.test.tsx`
- `__tests__/embed/postMessage.test.ts`
- `cypress/e2e/embed-flow.cy.ts`

#### 4.2 Performance Optimization

**Optimization Targets:**
- Load time: < 2s (3G network)
- Time to Interactive: < 3s
- Bundle size: < 200KB (gzipped)
- Lighthouse score: > 90

**Optimizations:**
1. Code splitting for embed widget
2. Lazy loading of non-critical components
3. Image optimization (WebP/AVIF)
4. CSS purging (remove unused styles)
5. API response caching (1 hour for config, 5 min for org data)

**Files to Modify:**
- `next.config.js` (code splitting config)
- `pages/[slug]/embed/requests.js` (lazy loading)
- `components/embed/EmbedWidget.tsx` (optimize renders)

#### 4.3 Documentation & Launch Prep

**Documentation to Create:**
1. **User Guide:** How to generate and add embed code
2. **Customization Guide:** Theme, colors, sizing options
3. **Platform Guides:** WordPress, Wix, Squarespace specific instructions
4. **Troubleshooting Guide:** Common issues and solutions
5. **API Docs:** PostMessage API reference

**Launch Checklist:**
- [ ] All security tests passing
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] Feature flags configured
- [ ] Monitoring/alerts set up
- [ ] Rollback plan documented
- [ ] Support team briefed
- [ ] Beta user feedback incorporated

**Deliverables:**
- [ ] Full test suite passing
- [ ] Performance optimizations complete
- [ ] Documentation published
- [ ] Launch checklist completed
- [ ] Monitoring dashboard configured

**Estimated Time:** 3-4 days

---

## 4. Database Changes

### 4.1 Required Schema Updates

```sql
-- White-label support
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS embed_custom_css TEXT,
ADD COLUMN IF NOT EXISTS embed_branding_disabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS embed_custom_logo_url TEXT;

-- Analytics tracking
CREATE TABLE IF NOT EXISTS embed_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  embed_type TEXT NOT NULL, -- 'requests', 'dashboard', etc.
  view_date DATE NOT NULL,
  view_count INTEGER DEFAULT 0,
  interaction_count INTEGER DEFAULT 0,
  payment_count INTEGER DEFAULT 0,
  payment_amount DECIMAL(10,2) DEFAULT 0,
  referrer_domain TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, embed_type, view_date)
);

CREATE INDEX IF NOT EXISTS idx_embed_analytics_org_date 
ON embed_analytics(organization_id, view_date DESC);

CREATE INDEX IF NOT EXISTS idx_embed_analytics_referrer 
ON embed_analytics(referrer_domain);

-- Embed settings (optional - can use organizations table)
CREATE TABLE IF NOT EXISTS embed_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  default_theme TEXT DEFAULT 'light',
  default_height INTEGER DEFAULT 800,
  default_border_radius INTEGER DEFAULT 12,
  allow_custom_css BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Data Migration

**For Existing Organizations:**
```sql
-- Set default embed settings for existing orgs with Embed Pro tier
INSERT INTO embed_settings (organization_id, default_theme, default_height)
SELECT id, 'light', 800
FROM organizations
WHERE subscription_tier IN ('enterprise', 'white_label')
ON CONFLICT (organization_id) DO NOTHING;
```

---

## 5. API Changes

### 5.1 New Endpoints

**Public Endpoints (No Auth Required):**
```
GET /api/embed/config/:slug
  - Returns embed configuration (theme, colors, branding)
  - Rate limited: 100 req/min per IP
  - CORS enabled for all origins
  
GET /api/embed/validate/:slug
  - Validates slug exists and embed is allowed
  - Returns: { valid: boolean, organization: {...} }
```

**Authenticated Endpoints (Require Auth):**
```
GET /api/admin/embed/analytics
  - Returns embed analytics for user's organization
  - Requires: authenticated user, organization membership
  
POST /api/admin/embed/settings
  - Updates embed settings (custom CSS, branding, etc.)
  - Requires: authenticated user, Embed Pro tier
  
GET /api/admin/embed/code
  - Returns generated embed code for organization
  - Requires: authenticated user, Embed Pro tier
```

### 5.2 Modified Endpoints

**Existing Endpoints to Enhance:**
```
POST /api/crowd-request/submit
  - Add embed tracking (track referrer, embed type)
  - Add rate limiting per embed origin
  
POST /api/payments/create
  - Add embed tracking for payments from embeds
  - Verify embed access for payment processing
```

---

## 6. Frontend Changes

### 6.1 New Components

**Components to Create:**
```
components/embed/
  ├── EmbedWidget.tsx          # Main embed widget component
  ├── EmbedPreview.tsx          # Preview iframe in admin
  ├── EmbedSettings.tsx         # Embed settings form
  ├── EmbedAnalytics.tsx        # Analytics dashboard
  ├── EmbedCodeDisplay.tsx      # Code display with copy
  └── postMessage.ts            # PostMessage utilities
```

### 6.2 Modified Components

**Components to Enhance:**
```
components/onboarding/EmbedCodeGenerator.tsx
  - Add live preview
  - Add platform-specific instructions
  - Add analytics preview

pages/[slug]/embed/requests.js
  - Add security headers
  - Add white-label support
  - Add postMessage API
  - Add analytics tracking

pages/admin/requests-page.tsx
  - Add embed settings section
  - Add embed analytics widget
```

### 6.3 New Pages

**Pages to Create:**
```
app/admin/embed/
  ├── page.tsx                  # Main embed settings page
  ├── analytics/page.tsx        # Embed analytics dashboard
  └── code/page.tsx             # Embed code generator
```

---

## 7. Security & Compliance

### 7.1 Security Checklist

**Critical Security Measures:**
- [ ] **Input Validation:** Sanitize all query params, slugs, user input
- [ ] **Origin Verification:** Verify embed origin matches allowed domains
- [ ] **Rate Limiting:** Limit requests per origin/IP (100 req/min)
- [ ] **Subscription Enforcement:** Verify Embed Pro tier before showing embeds
- [ ] **CORS Configuration:** Only allow trusted origins
- [ ] **XSS Prevention:** Sanitize all dynamic content in embeds
- [ ] **CSRF Protection:** Use CSRF tokens for authenticated actions
- [ ] **Payment Security:** Extra validation for payments from embeds
- [ ] **Data Isolation:** Ensure organization data is properly scoped
- [ ] **Audit Logging:** Log all embed interactions for security audits

### 7.2 Compliance Considerations

**GDPR/Privacy:**
- Embeds collect user data (requests, payments)
- Must respect user privacy preferences
- Cookie consent handling in embeds
- Data retention policies

**PCI DSS (Payments):**
- Payment forms in embeds must comply with PCI
- No sensitive payment data stored client-side
- Use Stripe Elements or similar secure payment forms
- Regular security audits

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Files to Test:**
```
__tests__/utils/embed-security.test.ts
__tests__/utils/embed-urls.test.ts
__tests__/utils/white-label.test.ts
__tests__/components/embed/EmbedWidget.test.tsx
```

### 8.2 Integration Tests

**Scenarios:**
1. Embed loads correctly with valid slug
2. Embed rejects invalid slug
3. Embed respects subscription tier
4. PostMessage communication works
5. White-label branding removal works
6. Analytics tracking works
7. Payment flow works in embed
8. Cross-domain authentication works

### 8.3 E2E Tests

**Test Cases:**
```
1. User generates embed code in admin
2. User pastes embed code on external website
3. External user submits request via embed
4. Payment is processed through embed
5. Analytics are tracked correctly
6. White-label settings apply correctly
```

### 8.4 Security Tests

**Security Scenarios:**
1. Attempt to access embed with invalid slug
2. Attempt to access embed without subscription
3. Attempt XSS injection via query params
4. Attempt CSRF attack on embed actions
5. Attempt to access other organization's data
6. Rate limiting enforcement
7. CORS policy enforcement

---

## 9. Performance Considerations

### 9.1 Optimization Goals

**Target Metrics:**
- Embed load time: < 2 seconds (3G network)
- Time to Interactive: < 3 seconds
- Bundle size: < 200KB (gzipped)
- Lighthouse score: > 90

### 9.2 Optimization Strategies

1. **Code Splitting:**
   - Lazy load embed widget
   - Separate embed bundle from main app
   - Dynamic imports for heavy dependencies

2. **Caching:**
   - Cache embed config (1 hour)
   - Cache organization data (5 minutes)
   - Use CDN for static assets

3. **Asset Optimization:**
   - Optimize images (WebP, AVIF)
   - Minimize CSS/JS
   - Use font subsetting

4. **Network:**
   - Use HTTP/2
   - Enable compression (gzip, brotli)
   - Preconnect to API domains

---

## 10. Rollout Plan

### 10.1 Phased Rollout

**Phase 1: Internal Testing (Week 1)**
- Deploy to staging environment
- Internal team testing
- Security audit

**Phase 2: Beta Testing (Week 2)**
- Select 5-10 Embed Pro customers
- Gather feedback
- Fix critical issues

**Phase 3: Gradual Rollout (Week 3)**
- Enable for 25% of Embed Pro users
- Monitor metrics
- Fix any issues

**Phase 4: Full Launch (Week 4)**
- Enable for all Embed Pro users
- Announce feature
- Monitor closely for first week

### 10.2 Feature Flags

**Use Feature Flags for:**
- Enabling embed feature per organization
- A/B testing embed UI variations
- Gradual rollout control
- Emergency kill switch

```typescript
// utils/feature-flags.ts
export async function isEmbedEnabled(organizationId: string): Promise<boolean> {
  // Check feature flag
  // Check subscription tier
  // Check rollout percentage
  return true; // or false
}
```

---

## 11. Monitoring & Analytics

### 11.1 Metrics to Track

**Business Metrics:**
- Number of organizations using embeds
- Number of websites embedding widgets
- Total embed views
- Conversion rate (embed view → request/payment)
- Revenue from embed-generated payments

**Technical Metrics:**
- Embed load time (p50, p95, p99)
- Error rate
- API response times
- Rate limit hits
- CORS rejections

**User Experience Metrics:**
- Embed interaction rate
- Form completion rate
- Payment success rate
- User feedback scores

### 11.2 Monitoring Tools

- **Error Tracking:** Sentry
- **Analytics:** Mixpanel/Amplitude + custom database
- **Performance:** Vercel Analytics + Custom RUM
- **Uptime:** Status page monitoring

---

## 12. Documentation Requirements

### 12.1 User Documentation

**Docs to Create:**
1. **Embed Setup Guide** (How to generate and add embed code)
2. **Customization Guide** (Theme, colors, sizing)
3. **Platform-Specific Guides** (WordPress, Wix, Squarespace)
4. **White-Label Guide** (Embed Pro features)
5. **Troubleshooting Guide** (Common issues and solutions)

### 12.2 Developer Documentation

**Docs to Create:**
1. **PostMessage API Reference**
2. **Query Parameters Reference**
3. **Security Best Practices**
4. **API Endpoints Documentation**
5. **Embedding Best Practices**

### 12.3 Internal Documentation

**Docs to Create:**
1. **Embed Architecture Overview**
2. **Security Audit Checklist**
3. **Incident Response Plan**
4. **Performance Tuning Guide**

---

## 13. Risk Assessment & Mitigation

### 13.1 High-Risk Areas

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data leakage across organizations | Critical | Low | Strict slug validation, organization scoping |
| Payment fraud via embeds | Critical | Medium | Extra validation, rate limiting, fraud detection |
| XSS attacks via query params | High | Medium | Input sanitization, CSP headers |
| Performance degradation | Medium | Medium | Code splitting, caching, monitoring |
| CORS misconfiguration | Medium | Low | Automated testing, security audit |
| Subscription bypass | High | Low | Server-side validation, audit logging |

### 13.2 Rollback Plan

**If Critical Issue Detected:**
1. Disable embed feature flag (instant kill switch)
2. Revert to previous deployment
3. Notify affected users
4. Investigate and fix issue
5. Re-enable after fix verified

---

## 14. Success Criteria

### 14.1 Launch Criteria

**Must Have:**
- ✅ Security headers implemented and tested
- ✅ Subscription enforcement working
- ✅ Basic embed functionality working
- ✅ Analytics tracking implemented
- ✅ Documentation complete
- ✅ Security audit passed
- ✅ Performance targets met

### 14.2 Success Metrics (30 Days Post-Launch)

**Targets:**
- 50+ organizations using embeds
- 100+ websites embedding widgets
- < 2% error rate
- < 2s average load time
- 10%+ conversion rate (view → interaction)
- Zero security incidents
- 4+ star user feedback

---

## 15. Timeline & Resource Allocation

### 15.1 Phase Timeline

**Total Duration: 4 weeks**

- **Week 1:** Foundation & Security (3-4 days)
- **Week 2:** Enhanced Widget (4-5 days)
- **Week 3:** White-Label & Advanced (5-6 days)
- **Week 4:** Multi-Domain & Testing (3-4 days)

**Buffer:** 2-3 days for testing, bug fixes, and unexpected issues

### 15.2 Resource Requirements

**Team:**
- 1 Full-stack Engineer (primary)
- 1 Frontend Engineer (support - Week 2)
- 1 Security Engineer (review - Week 1)
- 1 QA Engineer (testing - Week 4)

**External:**
- Security audit (optional but recommended)
- Performance testing tools

---

## 16. Open Questions & Decisions Needed

### 16.1 Product Decisions

1. **Script Tag vs Iframe:** Should we prioritize script tag embed in Phase 3, or defer to future?
2. **Custom Domain Support:** Should this be Phase 3 or defer to Phase 5+?
3. **Event-Specific Embeds:** Should event-specific embeds be Phase 3 or Phase 4?
4. **Pricing Validation:** Is current Embed Pro pricing ($99/month) correct for white-label features?

### 16.2 Technical Decisions

1. **CORS Policy:** Allow all origins (for maximum compatibility) or maintain allowlist (for security)?
   - **Recommendation:** Start with all origins, add allowlist option for Embed Pro users
2. **Rate Limiting:** Per-IP or per-organization?
   - **Recommendation:** Per-IP (100 req/min) to prevent abuse while allowing legitimate traffic
3. **Analytics Retention:** How long to store embed analytics?
   - **Recommendation:** 90 days rolling window, aggregate older data monthly
4. **Performance Budget:** Is 200KB bundle size achievable with all features?
   - **Recommendation:** Yes, with code splitting and lazy loading

### 16.3 Business Decisions

1. **Beta Program:** Who should be in the beta program?
2. **Support Level:** What level of support will we provide for embed issues?
3. **Monetization:** Should we track and report embed ROI to customers?

---

## 17. Next Steps

### Immediate Actions (This Week)

1. ✅ **Review this strategy** with team
2. ✅ **Get approvals** for timeline and resources
3. ✅ **Set up project board** with tasks
4. ✅ **Create feature branch** for embed work
5. ✅ **Schedule kickoff meeting**

### Week 1 Actions

1. Implement security headers
2. Create embed security utilities
3. Set up embed analytics database
4. Begin embed widget component

---

## Appendix: Code Examples

### A.1 Embed Route with Security

```typescript
// pages/[slug]/embed/requests.js
export default async function EmbedRequestsPage({ params }) {
  const { slug } = params;
  
  // Validate embed access
  const validation = await validateEmbedAccess(
    slug,
    headers().get('referer'),
    'tipjar'
  );
  
  if (!validation.allowed) {
    return <EmbedError message={validation.reason} />;
  }
  
  const { organization } = validation;
  
  // Check white-label settings
  const branding = getEmbedBrandingConfig(organization);
  
  // Track embed view
  await trackEmbedView(organization.id, 'requests', headers().get('referer'));
  
  return (
    <EmbedWidget
      organization={organization}
      branding={branding}
      theme={searchParams.theme || 'light'}
    />
  );
}
```

### A.2 PostMessage Handler

```typescript
// components/embed/postMessage.ts
export function usePostMessage() {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Verify origin in production
      if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = process.env.ALLOWED_EMBED_ORIGINS?.split(',') || [];
        if (!allowedOrigins.includes(event.origin)) return;
      }
      
      switch (event.data.type) {
        case 'request-dimensions':
          sendToParent({ type: 'dimensions', height: document.body.scrollHeight });
          break;
        case 'set-theme':
          setTheme(event.data.theme);
          break;
      }
    };
    
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);
}
```

### A.3 Embed Analytics Tracking

```typescript
// utils/embed-analytics.ts
export async function trackEmbedInteraction(
  organizationId: string,
  interactionType: 'view' | 'request' | 'payment',
  metadata?: any
) {
  const today = new Date().toISOString().split('T')[0];
  
  await supabase.rpc('increment_embed_analytics', {
    p_organization_id: organizationId,
    p_embed_type: 'requests',
    p_view_date: today,
    p_interaction_type: interactionType,
    p_metadata: metadata
  });
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Owner:** Platform Engineering Team  
**Status:** Draft - Pending Review


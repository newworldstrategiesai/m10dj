# 🎪 Venue Account Feature - Comprehensive Plan

## Executive Summary

Enable venues (like "Silkys") to create accounts and invite multiple performers/DJs to set up individual tip pages under the venue's brand. URLs would be structured as `tipjar.live/silkys/dj1`, `tipjar.live/silkys/dj2`, etc.

**Key Value Propositions:**
- Venues can onboard entire rosters at once
- Branded, cohesive experience under venue umbrella
- Simplified billing (venue pays, performers benefit)
- Centralized analytics and management
- Cross-promotion opportunities

---

## 🏗️ Architecture Overview

### Hierarchical Organization Model

```
Venue Organization (Parent)
├── Organization Type: "venue"
├── Slug: "silkys"
├── Owner: Venue Manager
└── Child Organizations (Performers)
    ├── Performer 1 (slug: "dj1")
    ├── Performer 2 (slug: "dj2")
    └── Performer 3 (slug: "dj3")
```

### URL Structure

**Current:** `tipjar.live/[slug]` → Single organization
**New:** `tipjar.live/[venue-slug]/[performer-slug]` → Nested performer page

**Examples:**
- `tipjar.live/silkys` → Venue landing page (roster directory)
- `tipjar.live/silkys/dj1` → DJ1's tip page
- `tipjar.live/silkys/dj1/requests` → DJ1's requests page
- `tipjar.live/silkys/dj2` → DJ2's tip page

---

## 📊 Database Schema Changes

### 1. Add Organization Type & Hierarchy

```sql
-- Add organization type and parent relationship
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS organization_type TEXT DEFAULT 'individual' 
  CHECK (organization_type IN ('individual', 'venue', 'performer')),
ADD COLUMN IF NOT EXISTS parent_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS performer_slug TEXT, -- Unique within parent venue
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create composite unique constraint for performer slugs within venue
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_venue_performer_slug 
ON organizations(parent_organization_id, performer_slug) 
WHERE parent_organization_id IS NOT NULL AND performer_slug IS NOT NULL;

-- Index for fast venue lookups
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id 
ON organizations(parent_organization_id) 
WHERE parent_organization_id IS NOT NULL;

-- Index for organization type filtering
CREATE INDEX IF NOT EXISTS idx_organizations_type 
ON organizations(organization_type);
```

### 2. Create Venue Invitations Table

```sql
CREATE TABLE IF NOT EXISTS venue_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  invited_email TEXT NOT NULL,
  performer_slug TEXT NOT NULL, -- Suggested slug for performer
  performer_name TEXT, -- Suggested name
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  invitation_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one pending invitation per email per venue
  UNIQUE(venue_organization_id, invited_email, status) 
  WHERE status = 'pending'
);

CREATE INDEX IF NOT EXISTS idx_venue_invitations_venue_id 
ON venue_invitations(venue_organization_id);

CREATE INDEX IF NOT EXISTS idx_venue_invitations_token 
ON venue_invitations(invitation_token);

CREATE INDEX IF NOT EXISTS idx_venue_invitations_email 
ON venue_invitations(invited_email);

-- RLS Policies
ALTER TABLE venue_invitations ENABLE ROW LEVEL SECURITY;

-- Venue admins can view/manage invitations
CREATE POLICY "Venue admins can manage invitations"
ON venue_invitations
FOR ALL
TO authenticated
USING (
  venue_organization_id IN (
    SELECT id FROM organizations 
    WHERE owner_id = auth.uid() 
    AND organization_type = 'venue'
  )
  OR venue_organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND is_active = true
  )
);

-- Invitees can view their own invitations
CREATE POLICY "Users can view own invitations"
ON venue_invitations
FOR SELECT
TO authenticated
USING (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
```

### 3. Update Organizations RLS for Hierarchical Access

```sql
-- Allow performers to view their parent venue
CREATE POLICY "Performers can view parent venue"
ON organizations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT parent_organization_id 
    FROM organizations 
    WHERE owner_id = auth.uid() 
    AND organization_type = 'performer'
  )
);

-- Allow venues to view their child performers
CREATE POLICY "Venues can view child performers"
ON organizations
FOR SELECT
TO authenticated
USING (
  parent_organization_id IN (
    SELECT id FROM organizations 
    WHERE owner_id = auth.uid() 
    AND organization_type = 'venue'
  )
  OR parent_organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND is_active = true
  )
);
```

---

## 🛣️ Routing & URL Handling

### Middleware Updates

**File:** `middleware.ts`

```typescript
// Handle nested venue/performer paths
// Pattern: /[venue-slug]/[performer-slug] or /[venue-slug]/[performer-slug]/requests

if (isTipJarDomain) {
  const pathParts = path.replace(/^\//, '').split('/').filter(Boolean);
  
  // Check for nested structure: [venue-slug]/[performer-slug]
  if (pathParts.length >= 2) {
    const [venueSlug, performerSlug, ...rest] = pathParts;
    
    // Lookup venue organization
    const { data: venueOrg } = await supabase
      .from('organizations')
      .select('id, name, organization_type')
      .eq('slug', venueSlug)
      .eq('organization_type', 'venue')
      .single();
    
    if (venueOrg) {
      // Lookup performer organization
      const { data: performerOrg } = await supabase
        .from('organizations')
        .select('id, name, slug, parent_organization_id')
        .eq('parent_organization_id', venueOrg.id)
        .eq('performer_slug', performerSlug)
        .eq('is_active', true)
        .single();
      
      if (performerOrg) {
        // Route to performer page
        if (rest.length === 0 || rest[0] === '') {
          // Performer landing page
          url.pathname = `/tipjar/${venueSlug}/${performerSlug}`;
        } else if (rest[0] === 'requests') {
          // Performer requests page
          url.pathname = `/organizations/${performerOrg.slug}/requests`;
        } else {
          // Other performer pages
          url.pathname = `/tipjar/${venueSlug}/${performerSlug}/${rest.join('/')}`;
        }
        
        // Set headers for organization context
        response.headers.set('x-venue-id', venueOrg.id);
        response.headers.set('x-performer-id', performerOrg.id);
        response.headers.set('x-organization-id', performerOrg.id);
        return NextResponse.rewrite(url);
      }
    }
  }
  
  // Fallback: Check for venue-only path (venue landing page)
  if (pathParts.length === 1) {
    const [slug] = pathParts;
    const { data: venueOrg } = await supabase
      .from('organizations')
      .select('id, name, organization_type')
      .eq('slug', slug)
      .eq('organization_type', 'venue')
      .single();
    
    if (venueOrg) {
      url.pathname = `/tipjar/venue/${slug}`;
      response.headers.set('x-venue-id', venueOrg.id);
      return NextResponse.rewrite(url);
    }
  }
}
```

### New Route Pages

1. **Venue Landing Page:** `app/(marketing)/tipjar/venue/[slug]/page.tsx`
   - Shows roster of performers
   - Links to each performer's tip page
   - Venue branding and info

2. **Performer Page (Nested):** `app/(marketing)/tipjar/[venue-slug]/[performer-slug]/page.tsx`
   - Performer's tip page with venue branding
   - Shows venue context (e.g., "Performing at Silkys")
   - Links back to venue roster

---

## 👥 User Flows

### Flow 1: Venue Onboarding

1. **Venue Signs Up**
   - Venue manager creates account at `tipjar.live/signup`
   - During onboarding, selects "I'm a venue/bar/restaurant"
   - Sets `organization_type = 'venue'`
   - Chooses venue slug (e.g., "silkys")
   - Completes venue profile

2. **Venue Dashboard**
   - New section: "Manage Performers"
   - Shows roster of performers
   - "Invite Performer" button

3. **Invite Performers**
   - Venue enters:
     - Performer email
     - Performer name
     - Suggested slug (e.g., "dj1", "band1", "sarah")
   - System generates invitation token
   - Email sent with invitation link

### Flow 2: Performer Accepts Invitation

1. **Performer Receives Email**
   - Email: "You've been invited to join Silkys on TipJar"
   - Link: `tipjar.live/accept-invite/[token]`

2. **Accept Invitation Page**
   - Shows venue info
   - Shows suggested performer slug
   - Performer can:
     - Sign up (if new user)
     - Sign in (if existing user)
     - Customize their slug (if available)

3. **Performer Organization Created**
   - Creates organization with:
     - `organization_type = 'performer'`
     - `parent_organization_id = venue.id`
     - `performer_slug = chosen_slug`
     - `owner_id = performer_user.id`
   - Auto-adds performer to `organization_members` of venue (role: 'member')
   - Marks invitation as accepted

4. **Performer Onboarding**
   - Redirects to performer onboarding
   - Sets up tip page
   - Customizes profile
   - URL: `tipjar.live/silkys/dj1`

### Flow 3: Public Access

1. **Venue Landing Page**
   - User visits `tipjar.live/silkys`
   - Sees roster of performers
   - Clicks performer → goes to `tipjar.live/silkys/dj1`

2. **Performer Tip Page**
   - User visits `tipjar.live/silkys/dj1`
   - Sees performer's tip page
   - Venue branding visible (header/footer)
   - Can tip, request songs, etc.

---

## 💰 Billing & Subscription Model

### Option 1: Venue Pays (Recommended)
- Venue subscribes to plan (e.g., Professional or Enterprise)
- All performers under venue get access
- Venue manages billing
- **Pros:** Simple, centralized, venue controls budget
- **Cons:** Venue must pay for all performers

### Option 2: Performer Pays
- Each performer has own subscription
- Venue gets discount or commission
- **Pros:** Performers control their own billing
- **Cons:** More complex, harder to onboard

### Option 3: Hybrid
- Venue pays base fee (covers up to X performers)
- Additional performers pay individually
- **Pros:** Flexible, scalable
- **Cons:** Most complex

**Recommendation:** Start with Option 1 (Venue Pays) for simplicity.

### Database Changes for Billing

```sql
-- Track which performers are covered by venue subscription
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS billing_covered_by_parent BOOLEAN DEFAULT FALSE;

-- When venue subscription is active, all child performers get access
-- Check in subscription helpers:
-- - If performer has parent_organization_id
-- - And parent has active subscription
-- - Then performer has access
```

---

## 🔐 Permissions & Access Control

### Venue Permissions

**Venue Owner/Admin Can:**
- ✅ View all performers' analytics (aggregated)
- ✅ Invite/remove performers
- ✅ Manage performer slugs
- ✅ Deactivate performers
- ❌ Cannot access individual performer's dashboard
- ❌ Cannot see individual performer's tips/requests (unless aggregated)

### Performer Permissions

**Performer Can:**
- ✅ Full access to their own tip page
- ✅ Manage their own profile
- ✅ View their own analytics
- ✅ See their own tips/requests
- ❌ Cannot see other performers' data
- ❌ Cannot manage venue settings

### Aggregated Analytics

```sql
-- View for venue analytics (aggregated across performers)
CREATE VIEW venue_performer_analytics AS
SELECT 
  v.id as venue_id,
  v.name as venue_name,
  COUNT(DISTINCT p.id) as total_performers,
  COUNT(DISTINCT cr.id) as total_requests,
  SUM(CASE WHEN cr.payment_status = 'paid' THEN cr.amount_paid ELSE 0 END) as total_revenue,
  COUNT(DISTINCT cr.event_qr_code) as total_events
FROM organizations v
LEFT JOIN organizations p ON p.parent_organization_id = v.id
LEFT JOIN crowd_requests cr ON cr.organization_id = p.id
WHERE v.organization_type = 'venue'
GROUP BY v.id, v.name;
```

---

## 📧 Invitation System

### Email Templates

**1. Venue Invitation Email**
```
Subject: You've been invited to join [Venue Name] on TipJar

Hi [Performer Name],

[Venue Name] has invited you to set up your tip page on TipJar!

Your page will be available at:
tipjar.live/[venue-slug]/[performer-slug]

[Accept Invitation Button]

This invitation expires in 30 days.
```

**2. Invitation Reminder**
- Send 7 days before expiration
- Send 1 day before expiration

**3. Invitation Accepted Confirmation**
- To venue: "[Performer Name] has accepted your invitation"
- To performer: "Welcome! Set up your tip page"

### API Endpoints

**1. Create Invitation**
```typescript
POST /api/tipjar/venue/invite-performer
{
  venueOrganizationId: string,
  email: string,
  performerName: string,
  performerSlug: string
}
```

**2. Accept Invitation**
```typescript
GET /tipjar/accept-invite/[token]
POST /api/tipjar/venue/accept-invitation
{
  token: string,
  performerSlug?: string (optional override)
}
```

**3. List Invitations**
```typescript
GET /api/tipjar/venue/[venueId]/invitations
```

**4. Cancel Invitation**
```typescript
DELETE /api/tipjar/venue/invitations/[invitationId]
```

---

## 🎨 UI Components

### Venue Dashboard Components

1. **Roster Management**
   - List of performers
   - Status (active, pending invitation, inactive)
   - Quick stats per performer
   - Actions: View page, Remove, Deactivate

2. **Invite Performer Modal**
   - Email input
   - Name input
   - Slug input (with availability check)
   - Preview URL
   - Send invitation button

3. **Venue Analytics Dashboard**
   - Total performers
   - Total tips across all performers
   - Top performers
   - Revenue trends
   - Event activity

### Performer Components

1. **Venue Context Banner**
   - Shows on performer's dashboard
   - "You're performing at [Venue Name]"
   - Link to venue roster

2. **Venue Branding**
   - Optional venue logo in header
   - Venue name in footer
   - Customizable by venue

---

## 🔄 Migration Strategy

### Phase 1: Database & Core Infrastructure (Week 1)
- ✅ Add organization_type, parent_organization_id columns
- ✅ Create venue_invitations table
- ✅ Update RLS policies
- ✅ Create indexes

### Phase 2: Invitation System (Week 2)
- ✅ Build invitation API endpoints
- ✅ Create email templates
- ✅ Build invitation acceptance flow
- ✅ Test invitation lifecycle

### Phase 3: Routing & Pages (Week 3)
- ✅ Update middleware for nested routing
- ✅ Create venue landing page
- ✅ Create nested performer pages
- ✅ Update existing performer pages to handle venue context

### Phase 4: UI & Dashboard (Week 4)
- ✅ Venue dashboard roster management
- ✅ Invite performer UI
- ✅ Performer onboarding with venue context
- ✅ Analytics aggregation

### Phase 5: Billing Integration (Week 5)
- ✅ Update subscription checks for hierarchical access
- ✅ Venue subscription covers performers
- ✅ Billing dashboard updates

### Phase 6: Testing & Polish (Week 6)
- ✅ End-to-end testing
- ✅ Performance testing
- ✅ Security audit
- ✅ Documentation

---

## 🚨 Cross-Product Considerations

### Data Isolation
- ✅ Venue accounts are TipJar-only (`product_context = 'tipjar'`)
- ✅ Performers inherit venue's product context
- ✅ No cross-contamination with DJ Dash or M10 DJ Company

### Billing Safety
- ✅ Venue subscriptions are separate from individual subscriptions
- ✅ Clear billing attribution (venue vs. individual)
- ✅ Prevent double-billing

### Analytics Isolation
- ✅ Venue analytics only aggregate TipJar data
- ✅ No mixing with other products' data

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Venue can create account
- [ ] Venue can invite performer
- [ ] Performer can accept invitation
- [ ] Performer organization created correctly
- [ ] Nested URLs work (`/venue/performer`)
- [ ] Performer can access their tip page
- [ ] Venue can view roster
- [ ] Venue can remove performer
- [ ] Invitation expiration works
- [ ] Duplicate slug prevention works

### Security Tests
- [ ] Venue cannot access performer's individual data
- [ ] Performer cannot access other performers' data
- [ ] RLS policies enforce isolation
- [ ] Invitation tokens are secure
- [ ] No SQL injection vulnerabilities

### Performance Tests
- [ ] Nested routing is fast (<100ms)
- [ ] Roster loading is optimized
- [ ] Analytics aggregation is efficient
- [ ] Database queries are indexed

### Edge Cases
- [ ] What if venue deletes account? (Cascade or orphan performers?)
- [ ] What if performer wants to leave venue?
- [ ] What if slug conflicts occur?
- [ ] What if invitation email bounces?
- [ ] What if performer already has TipJar account?

---

## 📈 Future Enhancements

### Phase 2 Features
1. **Venue Branding Customization**
   - Venue can customize header/footer for all performer pages
   - Venue logo on performer pages
   - Custom color schemes

2. **Venue Analytics Dashboard**
   - Real-time dashboard
   - Performance comparisons
   - Revenue sharing reports

3. **Bulk Invitations**
   - CSV upload for multiple performers
   - Template-based invitations

4. **Venue Events**
   - Venue can create events
   - All performers can use event QR codes
   - Unified event analytics

5. **Revenue Sharing**
   - Venue gets percentage of tips
   - Configurable split
   - Automated payouts

### Phase 3 Features
1. **Multi-Venue Support**
   - Performers can belong to multiple venues
   - Venue switching in dashboard

2. **Venue Marketplace**
   - Public directory of venues
   - Venue discovery
   - Booking integration

---

## 🎯 Success Metrics

### Adoption Metrics
- Number of venue accounts created
- Average performers per venue
- Invitation acceptance rate
- Time to onboard first performer

### Engagement Metrics
- Tips per performer (venue vs. individual)
- Requests per performer
- Event activity
- Revenue per venue

### Business Metrics
- Venue subscription conversion
- Revenue from venue accounts
- Customer lifetime value (venue vs. individual)

---

## ⚠️ Risks & Mitigations

### Risk 1: Slug Conflicts
**Mitigation:** 
- Enforce uniqueness within venue
- Suggest alternatives if conflict
- Allow manual override

### Risk 2: Venue Account Deletion
**Mitigation:**
- Cascade delete performers (or orphan them)
- Warn venue before deletion
- Export data before deletion

### Risk 3: Billing Complexity
**Mitigation:**
- Start simple (venue pays)
- Clear billing attribution
- Transparent pricing

### Risk 4: Performance at Scale
**Mitigation:**
- Index all foreign keys
- Cache venue rosters
- Optimize nested queries
- Consider read replicas

---

## 📝 Implementation Notes

### Code Organization

```
app/
  (marketing)/
    tipjar/
      venue/
        [slug]/
          page.tsx (venue landing)
          dashboard/
            page.tsx (venue dashboard)
            roster/
              page.tsx (manage performers)
      [venue-slug]/
        [performer-slug]/
          page.tsx (performer page)
      accept-invite/
        [token]/
          page.tsx (accept invitation)

api/
  tipjar/
    venue/
      invite-performer/
        route.ts
      accept-invitation/
        route.ts
      invitations/
        route.ts
```

### Environment Variables

```env
# Venue feature flags
NEXT_PUBLIC_ENABLE_VENUE_ACCOUNTS=true
VENUE_INVITATION_EXPIRY_DAYS=30
MAX_PERFORMERS_PER_VENUE=100
```

---

## 🚀 Launch Plan

### Soft Launch (Beta)
1. Invite 3-5 venues to test
2. Gather feedback
3. Iterate on UX
4. Fix critical bugs

### Public Launch
1. Marketing campaign
2. Documentation
3. Support resources
4. Onboarding flow optimization

---

## 📚 Documentation Needs

1. **Venue Onboarding Guide**
   - How to create venue account
   - How to invite performers
   - How to manage roster

2. **Performer Guide**
   - How to accept invitation
   - How to set up tip page
   - How to customize profile

3. **API Documentation**
   - Venue invitation endpoints
   - Nested routing rules
   - Permission model

---

## ✅ Next Steps

1. **Review & Approve Plan**
   - Stakeholder review
   - Technical review
   - UX review

2. **Create Detailed Tickets**
   - Break down into tasks
   - Assign priorities
   - Estimate effort

3. **Set Up Development Environment**
   - Database migration scripts
   - Feature flags
   - Test data

4. **Begin Implementation**
   - Start with Phase 1
   - Iterate based on feedback

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** Planning Phase


# Tip Jar Live Batch Creation & Account Claiming - Implementation Plan

## Executive Summary

Enable super admins to batch create fully configured Tip Jar Live pages for prospects. These pages will be immediately accessible via link/QR code, allowing prospects to accept tips before creating accounts. Later, prospects can create accounts to claim their pages, edit configurations, and add banking information to collect tips that were received before account creation.

**Key Value Propositions:**
- Instant onboarding: Send link + QR code immediately
- Zero friction: Prospects can accept tips before signup
- Seamless claim: Convert pre-created page to owned account
- Retroactive payouts: Collect tips received before account creation

---

## 🏗️ Architecture Overview

### Core Concept: "Unclaimed Organizations"

**Current State:**
- Organizations require `owner_id` (NOT NULL, UNIQUE)
- Must have authenticated user at creation time
- All features locked behind account ownership

**New State:**
- Organizations can have `owner_id = NULL` (unclaimed)
- Full Tip Jar page functionality without authentication
- Secure claim process links email/phone to organization
- Tips received before claiming are held and transferable

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: BATCH CREATION (Super Admin)                       │
├─────────────────────────────────────────────────────────────┤
│ 1. Admin uploads CSV/batch creates organizations            │
│ 2. Organizations created with owner_id = NULL               │
│ 3. All Tip Jar settings pre-configured                      │
│ 4. Unique slug generated for each                           │
│ 5. Link + QR code generated immediately                     │
│ 6. Email/SMS sent to prospect with link                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: ACTIVE USE (Before Account Creation)               │
├─────────────────────────────────────────────────────────────┤
│ 1. Prospect shares link/QR code with audience               │
│ 2. Tips received → stored with organization_id              │
│ 3. Payments route to platform Stripe account                │
│ 4. Tip metadata includes: organization_id, prospect_email   │
│ 5. Organization status: unclaimed, receiving_tips           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: ACCOUNT CLAIMING                                   │
├─────────────────────────────────────────────────────────────┤
│ 1. Prospect clicks "Claim Your Page" link                   │
│ 2. Creates account with email matching prospect_email       │
│ 3. System matches email → finds unclaimed organization      │
│ 4. Updates organization: owner_id = new_user_id             │
│ 5. Transfers all tips to claimed organization               │
│ 6. Redirects to onboarding flow                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: POST-CLAIM (Normal Operations)                     │
├─────────────────────────────────────────────────────────────┤
│ 1. User completes onboarding                                │
│ 2. Sets up Stripe Connect account                           │
│ 3. Historical tips transferred to Connect account           │
│ 4. Future tips route directly to Connect account            │
│ 5. Full admin access to page settings                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Changes

### 1. Modify Organizations Table

**Migration:** `20260112000000_allow_unclaimed_organizations.sql`

```sql
-- Allow owner_id to be NULL for unclaimed organizations
ALTER TABLE organizations 
  ALTER COLUMN owner_id DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS organizations_owner_id_key; -- Remove unique constraint

-- Add new columns for prospect management
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS prospect_email TEXT,
  ADD COLUMN IF NOT EXISTS prospect_phone TEXT,
  ADD COLUMN IF NOT EXISTS claim_token TEXT UNIQUE, -- Secure token for claiming
  ADD COLUMN IF NOT EXISTS claim_token_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;

-- Create unique index on claim_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_organizations_claim_token ON organizations(claim_token) WHERE claim_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_prospect_email ON organizations(prospect_email) WHERE prospect_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_unclaimed ON organizations(is_claimed, created_at) WHERE is_claimed = FALSE;

-- Add constraint: if owner_id is NULL, is_claimed must be FALSE
ALTER TABLE organizations
  ADD CONSTRAINT check_unclaimed_consistency 
  CHECK ((owner_id IS NULL AND is_claimed = FALSE) OR (owner_id IS NOT NULL));

-- Update RLS policies to allow public read for unclaimed organizations
-- (needed for Tip Jar pages to work before claiming)

-- Policy: Anyone can view unclaimed organizations (for public Tip Jar pages)
DROP POLICY IF EXISTS "Public can view unclaimed organizations" ON organizations;
CREATE POLICY "Public can view unclaimed organizations"
  ON organizations
  FOR SELECT
  TO anon, authenticated
  USING (
    (is_claimed = FALSE AND subscription_status IN ('trial', 'active')) OR
    (owner_id = auth.uid()) OR
    is_platform_admin()
  );
```

**Impact Analysis:**
- ✅ **DJDash.net**: No impact (uses owner_id validation)
- ✅ **M10DJCompany.com**: No impact (uses owner_id validation)
- ⚠️ **TipJar.live**: Allows anonymous access to unclaimed orgs (intentional)

---

### 2. Create Tip Claims Tracking Table

**Migration:** `20260112000001_create_tip_claims_table.sql`

```sql
-- Track tips received before account claiming
-- This ensures we can transfer funds when account is claimed

CREATE TABLE IF NOT EXISTS unclaimed_tip_balance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment information
  total_amount_cents INTEGER NOT NULL DEFAULT 0, -- Total tips received
  total_fees_cents INTEGER NOT NULL DEFAULT 0, -- Platform fees deducted
  net_amount_cents INTEGER NOT NULL DEFAULT 0, -- Amount available to claim
  
  -- Payment processing
  stripe_payment_intent_ids TEXT[], -- Array of payment intent IDs
  stripe_charge_ids TEXT[], -- Array of charge IDs
  
  -- Status tracking
  is_transferred BOOLEAN DEFAULT FALSE,
  transferred_at TIMESTAMP WITH TIME ZONE,
  transferred_to_stripe_account_id TEXT, -- Connected account ID after claiming
  
  -- Metadata
  tip_count INTEGER DEFAULT 0, -- Number of individual tips
  first_tip_at TIMESTAMP WITH TIME ZONE,
  last_tip_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_unclaimed_tip_balance_org ON unclaimed_tip_balance(organization_id);
CREATE INDEX IF NOT EXISTS idx_unclaimed_tip_balance_transferred ON unclaimed_tip_balance(is_transferred);

-- RLS: Only admins and organization owners can view
ALTER TABLE unclaimed_tip_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and owners can view tip balances"
  ON unclaimed_tip_balance
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE owner_id = auth.uid() OR is_platform_admin()
    )
  );
```

---

## 🔧 API Endpoints

### 1. Batch Create Tip Jar Pages (Super Admin Only)

**Endpoint:** `POST /api/admin/tipjar/batch-create`

**Location:** `pages/api/admin/tipjar/batch-create.js`

**Request:**
```json
{
  "prospects": [
    {
      "email": "dj@example.com",
      "phone": "+1234567890", // Optional
      "business_name": "DJ John's Events",
      "artist_name": "DJ John", // Optional, defaults to business_name
      "slug": "dj-john", // Optional, auto-generated if not provided
      "configuration": {
        "requests_header_artist_name": "DJ John",
        "requests_header_location": "Memphis, TN",
        "requests_header_date": "2024-01-15",
        "accent_color": "#10b981",
        "requests_video_url": "https://...",
        // ... any other organization settings
      }
    },
    // ... more prospects
  ]
}
```

**Response:**
```json
{
  "success": true,
  "created": 5,
  "failed": 0,
  "organizations": [
    {
      "id": "uuid",
      "slug": "dj-john",
      "url": "https://tipjar.live/dj-john/requests",
      "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://tipjar.live/dj-john/requests",
      "claim_link": "https://tipjar.live/claim/dj-john?token=abc123",
      "prospect_email": "dj@example.com"
    }
  ]
}
```

**Implementation Requirements:**
- ✅ Require platform admin authentication
- ✅ Validate email format and uniqueness
- ✅ Generate unique slugs with collision handling
- ✅ Create claim token (JWT with 90-day expiry)
- ✅ Set `product_context = 'tipjar'`
- ✅ Set `subscription_status = 'trial'`
- ✅ Set `subscription_tier = 'starter'`
- ✅ Create default trial period (14 days, can be extended)

---

### 2. Claim Organization Page

**Endpoint:** `POST /api/tipjar/claim`

**Location:** `pages/api/tipjar/claim.js`

**Request:**
```json
{
  "claim_token": "abc123...",
  "email": "dj@example.com", // Must match prospect_email
  "password": "secure-password",
  "business_name": "DJ John's Events" // Optional, can update name
}
```

**Response:**
```json
{
  "success": true,
  "organization_id": "uuid",
  "user_id": "uuid",
  "pending_tips_cents": 5000,
  "redirect_url": "/tipjar/onboarding?claimed=true"
}
```

**Implementation Flow:**
1. Verify claim_token is valid and not expired
2. Verify email matches prospect_email
3. Create user account (or link to existing account)
4. Update organization: set `owner_id`, `is_claimed = TRUE`, `claimed_at`
5. Transfer unclaimed tips to organization balance
6. Send welcome email with next steps
7. Return redirect URL for onboarding

---

### 3. Get Unclaimed Page Status

**Endpoint:** `GET /api/tipjar/unclaimed/:slug`

**Location:** `pages/api/tipjar/unclaimed/[slug].js`

**Response:**
```json
{
  "organization": {
    "slug": "dj-john",
    "name": "DJ John's Events",
    "is_claimed": false,
    "pending_tips_cents": 5000,
    "tip_count": 3,
    "last_tip_at": "2024-01-10T12:00:00Z"
  },
  "claim_available": true,
  "claim_link": "https://tipjar.live/claim/dj-john?token=abc123"
}
```

**Access:** Public (for prospect to check status)

---

### 4. List Batch Created Organizations (Admin)

**Endpoint:** `GET /api/admin/tipjar/batch-created`

**Query Params:**
- `status`: `unclaimed`, `claimed`, `all` (default: `all`)
- `created_by`: admin user ID
- `limit`, `offset`: pagination

**Response:**
```json
{
  "organizations": [
    {
      "id": "uuid",
      "slug": "dj-john",
      "name": "DJ John's Events",
      "prospect_email": "dj@example.com",
      "is_claimed": false,
      "claimed_at": null,
      "pending_tips_cents": 5000,
      "tip_count": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "created_by_admin": "admin@m10djcompany.com",
      "url": "https://tipjar.live/dj-john/requests"
    }
  ],
  "total": 25,
  "unclaimed": 15,
  "claimed": 10
}
```

---

## 💳 Payment Processing Modifications

### Update Checkout Creation for Unclaimed Organizations

**File:** `pages/api/crowd-request/create-checkout.js`

**Changes Needed:**

```javascript
// After fetching organization, check if unclaimed
if (organization && !organization.is_claimed) {
  // For unclaimed organizations:
  // 1. Store payment intent with organization_id
  // 2. Route payment to platform Stripe account (not Connect)
  // 3. Track in unclaimed_tip_balance table
  
  // Create checkout session WITHOUT destination/transfer
  // Platform receives payment directly
  
  // After payment success (webhook), update unclaimed_tip_balance
}
```

**Webhook Handling:**
- When payment succeeds for unclaimed org → update `unclaimed_tip_balance`
- When org is claimed → transfer balance to Stripe Connect account
- Track all payment intents with organization_id for reconciliation

---

### Transfer Unclaimed Tips on Claim

**File:** `pages/api/tipjar/claim.js` (or separate transfer service)

**Flow:**
1. Calculate total unclaimed balance
2. Create Stripe transfer from platform account to connected account
3. Update `unclaimed_tip_balance.is_transferred = TRUE`
4. Log transfer for audit

**Note:** Handle edge case where Connect account not yet set up:
- Hold funds until Connect account created
- Show balance in dashboard with "Complete Payment Setup" prompt

---

## 🎨 Admin UI Components

### 1. Batch Creation Interface

**Location:** `pages/admin/tipjar/batch-create.tsx`

**Features:**
- CSV upload or manual entry form
- Preview of organizations to be created
- Configuration template selection
- Email/SMS notification options
- Bulk QR code generation
- Export results (CSV with links + QR codes)

**UI Flow:**
```
┌─────────────────────────────────────┐
│ Batch Create Tip Jar Pages          │
├─────────────────────────────────────┤
│ [Upload CSV] or [Manual Entry]      │
│                                     │
│ Configuration Template: [Select]    │
│ ☑ Send email notifications         │
│ ☑ Generate QR codes                 │
│                                     │
│ Preview (5 organizations):          │
│ • dj-john (dj@example.com)          │
│ • dj-jane (jane@example.com)        │
│ ...                                 │
│                                     │
│ [Cancel] [Create Pages]             │
└─────────────────────────────────────┐
```

---

### 2. Batch Created Organizations Dashboard

**Location:** `pages/admin/tipjar/batch-dashboard.tsx`

**Features:**
- Filter by status (unclaimed/claimed)
- Search by email, slug, name
- View pending tips for each
- Resend claim links
- Export reports
- Bulk actions (extend trial, resend notifications)

**Metrics Display:**
- Total created: 50
- Unclaimed: 30 (60%)
- Claimed: 20 (40%)
- Total pending tips: $1,250.00
- Average tips per page: $25.00

---

## 📧 Email/SMS Notifications

### 1. Prospect Welcome Email

**Trigger:** After batch creation

**Template:** `emails/tipjar/prospect-welcome.html`

**Content:**
- Welcome message
- Their unique Tip Jar link
- QR code image
- Claim link (prominent CTA)
- Instructions for sharing
- Support contact info

---

### 2. Claim Reminder Email

**Trigger:** 
- 7 days after creation (if unclaimed)
- 14 days after creation (if unclaimed and has tips)
- 30 days before claim token expires

**Template:** `emails/tipjar/claim-reminder.html`

**Content:**
- Show pending tips amount (if any)
- Claim link
- Instructions for claiming

---

### 3. Account Claimed Email

**Trigger:** After successful claim

**Template:** `emails/tipjar/claimed-success.html`

**Content:**
- Welcome to Tip Jar Live
- Dashboard link
- Next steps (onboarding, payment setup)
- Pending tips balance

---

## 🔐 Security Considerations

### Claim Token Security

- **Generation:** JWT with 90-day expiry
- **Payload:** `{ org_id, prospect_email, created_at }`
- **Verification:** Verify signature + expiry + email match
- **Rate Limiting:** Max 5 claim attempts per token per hour
- **One-time Use:** Consider invalidating token after successful claim (optional)

### Payment Security

- **Unclaimed Tips:** Stored in platform Stripe account (separate from user funds)
- **Transfer Audit:** Log all transfers for compliance
- **Hold Period:** Consider 7-day hold before allowing transfers (fraud prevention)

### Access Control

- **RLS Policies:** Updated to allow public read of unclaimed orgs (Tip Jar pages only)
- **Admin Access:** Only platform admins can create unclaimed orgs
- **Claim Verification:** Email must match prospect_email

---

## 🧪 Testing Requirements

### Unit Tests

1. **Batch Creation API**
   - ✅ Validates admin access
   - ✅ Generates unique slugs
   - ✅ Creates claim tokens
   - ✅ Handles duplicate emails gracefully

2. **Claim API**
   - ✅ Validates claim token
   - ✅ Matches email correctly
   - ✅ Transfers organization ownership
   - ✅ Transfers unclaimed tips

3. **Payment Processing**
   - ✅ Routes to platform account for unclaimed orgs
   - ✅ Updates unclaimed_tip_balance
   - ✅ Transfers funds on claim

### Integration Tests

1. **End-to-End Claim Flow**
   - Create unclaimed org → Receive tips → Claim account → Verify tips transferred

2. **Payment Flow**
   - Unclaimed org receives tips → Funds held → Claim → Transfer to Connect

3. **Admin Batch Creation**
   - Create 10 orgs → Verify all accessible → Claim one → Verify isolation

---

## 📋 Implementation Checklist

### Phase 1: Database & Core APIs (Week 1)

- [ ] Create migration for unclaimed organizations
- [ ] Create migration for unclaimed_tip_balance table
- [ ] Update RLS policies
- [ ] Create batch creation API
- [ ] Create claim API
- [ ] Create unclaimed status API
- [ ] Update payment processing for unclaimed orgs

### Phase 2: Admin UI (Week 2)

- [ ] Build batch creation interface
- [ ] Build batch dashboard
- [ ] Add CSV upload/export
- [ ] Integrate QR code generation
- [ ] Add filtering/search

### Phase 3: Email/SMS & Notifications (Week 2)

- [ ] Create email templates
- [ ] Set up email triggers
- [ ] Create SMS templates (if applicable)
- [ ] Set up reminder schedule

### Phase 4: Payment Integration (Week 3)

- [ ] Update checkout creation logic
- [ ] Update webhook handlers
- [ ] Create tip transfer service
- [ ] Add balance display in dashboard
- [ ] Test payment flows end-to-end

### Phase 5: Testing & Documentation (Week 3)

- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Manual QA testing
- [ ] Update admin documentation
- [ ] Create user-facing claim flow docs

### Phase 6: Launch Preparation (Week 4)

- [ ] Security audit
- [ ] Performance testing
- [ ] Load testing (batch creation)
- [ ] Create rollback plan
- [ ] Prepare launch checklist

---

## 🚨 Risk Mitigation

### Cross-Product Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Unclaimed orgs visible on DJDash/M10 | High | Filter by `product_context = 'tipjar'` in all queries |
| Payment routing to wrong account | High | Validate `product_context` in payment flows |
| Data leakage between brands | High | Strict RLS policies, product context checks |
| Unclaimed orgs interfere with search | Medium | Add `is_claimed` filter to public listings |

### Payment Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Funds held indefinitely | High | Automatic reminders, manual review process |
| Fraudulent claim attempts | Medium | Email verification, rate limiting |
| Payment disputes on unclaimed tips | Medium | Clear terms, audit trail |

---

## 📊 Success Metrics

### Key Performance Indicators

1. **Batch Creation Efficiency**
   - Target: Create 50+ pages in < 5 minutes
   - Measure: Batch creation API response time

2. **Claim Conversion Rate**
   - Target: 70%+ of created pages claimed within 30 days
   - Measure: Claim rate by days since creation

3. **Tip Generation**
   - Target: Average $25+ in tips before claiming
   - Measure: Average pending tips per unclaimed org

4. **Payment Transfer Success**
   - Target: 100% of claimed tips successfully transferred
   - Measure: Transfer success rate, audit logs

---

## 🔄 Future Enhancements

### Potential Additions

1. **Automated Reminders**
   - Smart reminders based on tip activity
   - SMS notifications for high-value tips

2. **Bulk Configuration Templates**
   - Save common configurations
   - Apply templates to batch creation

3. **Analytics Dashboard**
   - Conversion funnel analysis
   - Tip trends by industry/location
   - Claim rate optimization

4. **API Access**
   - REST API for programmatic batch creation
   - Webhook notifications for claims

5. **A/B Testing**
   - Test different claim link placements
   - Optimize email templates

---

## 📝 Notes & Considerations

### Questions to Resolve

1. **Trial Period:** 
   - Should unclaimed orgs have a trial period?
   - Recommendation: Yes, 30 days free, then auto-archive if unclaimed

2. **Claim Token Expiry:**
   - 90 days recommended, but configurable?
   - Yes, make it configurable per batch

3. **Historical Tips:**
   - What if prospect never claims?
   - Hold for 90 days, then refund to tippers (or donate to charity)

4. **Multiple Unclaimed Orgs:**
   - Can one email have multiple unclaimed orgs?
   - No, enforce uniqueness at batch creation

5. **Slug Collision:**
   - What if prospect's desired slug is taken?
   - Auto-generate alternative, notify admin

---

## 🎯 Conclusion

This implementation plan provides a complete blueprint for enabling super admin batch creation of Tip Jar Live pages. The architecture supports immediate use, secure claiming, and seamless fund transfers while maintaining platform security and cross-product isolation.

**Estimated Timeline:** 3-4 weeks  
**Complexity:** Medium-High  
**Risk Level:** Medium (requires careful payment handling)

**Next Steps:**
1. Review and approve plan
2. Set up development branch
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews

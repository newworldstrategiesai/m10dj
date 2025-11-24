# 🚀 SaaS Migration Checklist

## Phase 1: Database Setup ✅

### Completed
- [x] Create organizations table migration
- [x] Add organization_id to crowd_requests table
- [x] Add organization_id to contacts table (migration ready)
- [x] Add organization_id to admin_settings table (migration ready)
- [x] Update RLS policies for crowd_requests
- [x] Update RLS policies for contacts
- [x] Create organization context utilities

### Next Steps
- [ ] Run migrations in Supabase
- [ ] Create default organization for existing data
- [ ] Verify data isolation works
- [ ] Add organization_id to events table
- [ ] Add organization_id to messages table
- [ ] Add organization_id to api_keys table

## Phase 2: API Updates ✅

### Completed
- [x] Update `/api/crowd-request/submit` to include organization_id
- [x] Update `/api/crowd-request/settings` to be organization-scoped
- [x] Update admin dashboard to filter by organization
- [x] Create `/api/subscriptions/create-checkout` for Stripe
- [x] Create `/api/webhooks/stripe` for subscription management

### Remaining
- [ ] Update `/api/crowd-request/stats` to filter by organization
- [ ] Update `/api/crowd-request/user-stats` to filter by organization
- [ ] Update other crowd-request API endpoints

## Phase 3: Frontend Updates ✅

### Completed
- [x] Update admin dashboard to use organization context
- [x] Add organization onboarding flow
- [x] Create welcome page with URLs and embed codes
- [x] Create plan selection page
- [x] Create subscription success page
- [x] Create embed code generator component
- [x] Create organization-specific public pages
- [x] Create embed version of requests page

### Remaining
- [ ] Update settings pages to be organization-scoped
- [ ] Update QR code generation to include organization context
- [ ] Add organization selector (if multi-org support needed)

## Phase 4: Additional Tables

### Pending
- [ ] Add organization_id to `contacts` table
- [ ] Add organization_id to `events` table
- [ ] Add organization_id to `admin_settings` table
- [ ] Add organization_id to `messages` table
- [ ] Add organization_id to `api_keys` table

## Phase 5: Stripe Integration 🔄

### Completed
- [x] Set up subscription creation API
- [x] Set up webhook handler
- [x] Create plan selection page
- [x] Create subscription success page
- [x] Implement trial period logic (14 days)

### Remaining
- [ ] Create Stripe products ($19, $49, $149) in Stripe dashboard
- [ ] Add price IDs to environment variables
- [ ] Create subscription management UI (upgrade/downgrade/cancel)
- [ ] Add subscription limits enforcement (starter = 5 events/month)
- [ ] Test webhook endpoint
- [ ] Set up Stripe customer portal

## Phase 6: Onboarding ✅

### Completed
- [x] Create welcome/onboarding flow
- [x] Create plan selection page
- [x] Create Stripe checkout integration
- [x] Create embed code generator
- [x] Show dedicated URLs
- [x] Create subscription success page

### Remaining
- [ ] Integrate with signup flow (auto-create organization)
- [ ] Add organization settings page
- [ ] Add first-event creation wizard

## Phase 7: Testing

### Pending
- [ ] Test data isolation (User A can't see User B's data)
- [ ] Test subscription limits (starter = 5 events/month)
- [ ] Test trial period expiration
- [ ] Test subscription upgrades/downgrades
- [ ] Test payment processing
- [ ] Test webhook handling

## Phase 8: Launch Prep

### Pending
- [ ] Update marketing site with new pricing
- [ ] Create comparison page (vs. competitors)
- [ ] Set up customer support system
- [ ] Create documentation
- [ ] Set up monitoring/analytics
- [ ] Prepare beta launch

---

## Migration Instructions

### Step 1: Run Database Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Run `20250123000000_create_organizations_table.sql`
3. Run `20250123000001_add_organization_id_to_crowd_requests.sql`
4. Verify tables were created successfully

### Step 2: Create Default Organization

```sql
-- Get your user ID first
SELECT id, email FROM auth.users;

-- Create default organization (replace USER_ID with your actual user ID)
INSERT INTO organizations (name, slug, owner_id, subscription_tier, subscription_status)
VALUES (
  'M10 DJ Company',
  'm10dj',
  'YOUR_USER_ID_HERE',
  'enterprise',
  'active'
)
RETURNING id;
```

### Step 3: Backfill Existing Data

```sql
-- Update existing crowd_requests with organization_id
-- Replace ORGANIZATION_ID with the ID from step 2
UPDATE crowd_requests 
SET organization_id = 'YOUR_ORGANIZATION_ID_HERE'
WHERE organization_id IS NULL;
```

### Step 4: Verify Data Isolation

```sql
-- Test: Try to query another user's data (should return empty)
-- This verifies RLS is working
SELECT * FROM crowd_requests 
WHERE organization_id NOT IN (
  SELECT id FROM organizations WHERE owner_id = auth.uid()
);
```

---

## Important Notes

1. **Data Isolation is Critical**: Always filter by `organization_id` in all queries
2. **Backward Compatibility**: During migration, some requests may have null `organization_id` - handle gracefully
3. **Public Requests**: Anonymous users can create requests, but we need to determine organization from eventCode
4. **Testing**: Test thoroughly before launching to ensure data isolation works

---

## Rollback Plan

If something goes wrong:

1. **Don't delete the organization_id column** - just make it nullable again
2. **Update RLS policies** to allow access without organization_id check
3. **Fix the issue** and re-run migrations

---

## Next Session Priorities

1. Complete API route updates
2. Add organization_id to remaining tables
3. Set up Stripe integration
4. Create onboarding flow


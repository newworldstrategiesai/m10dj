# Multi-Tenant Architecture Audit & Implementation Plan

## Executive Summary

This audit identifies critical gaps in the multi-tenant implementation. The system currently has a **hybrid architecture** mixing:
- **Platform Admin** (you - Ben Murray) - should see ALL data across all organizations
- **SaaS Customers** (DJs) - should ONLY see their own organization's data

## Critical Issues Found

### 1. Database Tables Missing `organization_id`

**HIGH PRIORITY - Data Leakage Risk:**

| Table | Status | Risk Level |
|-------|--------|------------|
| `contacts` | ✅ Has migration but needs verification | HIGH |
| `events` | ✅ Has migration but needs verification | HIGH |
| `contact_submissions` | ❌ Missing | CRITICAL |
| `testimonials` | ❌ Missing | MEDIUM |
| `faqs` | ❌ Missing | MEDIUM |
| `preferred_vendors` | ❌ Missing | MEDIUM |
| `preferred_venues` | ❌ Missing | MEDIUM |
| `services` | ❌ Missing | MEDIUM |
| `blog_posts` | ❌ Missing | LOW (if SaaS customers can create blogs) |
| `gallery_images` | ❌ Missing | MEDIUM |
| `admin_settings` | ✅ Has migration | OK |
| `crowd_requests` | ✅ Has migration | OK |
| `payments` | ❌ Missing | CRITICAL |
| `invoices` | ❌ Missing | CRITICAL |
| `contracts` | ❌ Missing | CRITICAL |
| `sms_conversations` | ❌ Missing | HIGH |
| `email_messages` | ❌ Missing | HIGH |
| `quote_selections` | ❌ Missing | HIGH |
| `service_selections` | ❌ Missing | HIGH |
| `payment_plans` | ❌ Missing | CRITICAL |
| `payment_installments` | ❌ Missing | CRITICAL |
| `discount_codes` | ❌ Missing | MEDIUM |
| `automation_queue` | ❌ Missing | MEDIUM |
| `automation_templates` | ❌ Missing | MEDIUM |

### 2. API Routes Not Filtering by Organization

**CRITICAL - Data Leakage:**

#### Routes That Need Organization Filtering:

1. **`/api/get-contacts.js`**
   - ❌ Admins see ALL contacts (should be platform-wide for admin, org-scoped for SaaS)
   - ✅ Non-admins filtered by `user_id` (but should be by `organization_id`)

2. **`/api/get-contact-projects.js`**
   - ❌ No organization filtering
   - ❌ Admins see all projects

3. **`/api/contact.js`** (Contact form submission)
   - ❌ Creates contacts without `organization_id`
   - ❌ Should determine organization from context (slug, event code, etc.)

4. **`/api/crowd-request/stats.js`**
   - ✅ Has organization filtering for non-admins
   - ⚠️ Admins see all stats (should be platform-wide)

5. **`/api/crowd-request/settings.js`**
   - ✅ Has organization filtering

6. **Missing Organization Filtering:**
   - `/api/get-sms-logs.js`
   - `/api/admin/notification-logs.js`
   - `/api/contacts/*` (all routes)
   - `/api/invoices/*`
   - `/api/payments.js`
   - `/api/contracts/*`
   - `/api/quote/*`
   - `/api/service-selection/*`
   - `/api/automation/*`
   - `/api/followups/*`

### 3. Admin vs SaaS User Separation

**CRITICAL - Access Control:**

#### Current Implementation:
- Admin identified by hardcoded email list: `['admin@m10djcompany.com', 'manager@m10djcompany.com', 'djbenmurray@gmail.com']`
- Admin sees ALL data (correct for platform admin)
- SaaS users filtered by `user_id` instead of `organization_id`

#### Problems:
1. **Hardcoded emails** - not scalable, not secure
2. **Mixed logic** - some routes use `user_id`, some use `organization_id`
3. **No clear separation** - admin routes vs SaaS routes not clearly defined
4. **RLS policies** - may not properly separate admin vs SaaS access

### 4. RLS (Row Level Security) Policies

**CRITICAL - Database Security:**

#### Current State:
- `organizations` - ✅ Has RLS policies
- `crowd_requests` - ✅ Has organization-scoped RLS
- `contacts` - ⚠️ Has `user_id`-based RLS, needs `organization_id`-based
- `admin_settings` - ✅ Has organization-scoped RLS
- Most other tables - ❌ Missing or incorrect RLS policies

#### Required RLS Pattern:

```sql
-- For SaaS users (organization owners):
-- Can only see data where organization_id matches their organization

-- For Platform Admin:
-- Can see ALL data (bypass RLS or special policy)
```

### 5. Data Creation Without Organization Context

**HIGH PRIORITY:**

When SaaS customers create data (contacts, events, etc.), the system must:
1. Determine their organization automatically
2. Set `organization_id` on all new records
3. Validate organization ownership

**Current Issues:**
- Contact form submissions don't set `organization_id`
- Some API routes create records without organization context
- No validation that user owns the organization

## Implementation Plan

### Phase 1: Database Schema (CRITICAL)

#### Step 1.1: Add `organization_id` to All Tenant-Scoped Tables

**Priority Order:**
1. **CRITICAL** (Financial & Legal):
   - `payments`
   - `invoices`
   - `contracts`
   - `payment_plans`
   - `payment_installments`

2. **CRITICAL** (Core Business Data):
   - `contact_submissions`
   - `contacts` (verify migration applied)
   - `events` (verify migration applied)

3. **HIGH** (Communication):
   - `sms_conversations`
   - `email_messages`
   - `quote_selections`
   - `service_selections`

4. **MEDIUM** (Content & Settings):
   - `testimonials`
   - `faqs`
   - `preferred_vendors`
   - `preferred_venues`
   - `services`
   - `gallery_images`
   - `discount_codes`
   - `automation_queue`
   - `automation_templates`

#### Step 1.2: Create Migration Template

Each migration should:
1. Add `organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`
2. Create index on `organization_id`
3. Backfill existing data (assign to admin's organization or create default)
4. Update RLS policies

#### Step 1.3: Update RLS Policies

Create helper function for admin check:
```sql
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email IN ('admin@m10djcompany.com', 'manager@m10djcompany.com', 'djbenmurray@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Phase 2: API Route Updates (CRITICAL)

#### Step 2.1: Create Organization Context Helper

```typescript
// utils/organization-helpers.ts
export async function getOrganizationContext(supabase: SupabaseClient, userId: string) {
  // Get user's organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single();
  
  return org?.id || null;
}

export async function requireOrganization(supabase: SupabaseClient, userId: string) {
  const orgId = await getOrganizationContext(supabase, userId);
  if (!orgId) {
    throw new Error('User does not have an organization');
  }
  return orgId;
}
```

#### Step 2.2: Update All API Routes

**Pattern for SaaS Users:**
```typescript
// Get user's organization
const orgId = await requireOrganization(supabase, user.id);

// Filter queries
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('organization_id', orgId);
```

**Pattern for Platform Admin:**
```typescript
const isAdmin = await isPlatformAdmin(user.email);

if (isAdmin) {
  // Admin sees all data (no filter)
  const { data } = await supabase.from('contacts').select('*');
} else {
  // SaaS user sees only their org
  const orgId = await requireOrganization(supabase, user.id);
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', orgId);
}
```

#### Step 2.3: Update Data Creation Routes

All routes that create data must:
1. Get organization from authenticated user
2. Set `organization_id` on new records
3. Validate organization ownership

### Phase 3: Admin Separation (HIGH PRIORITY)

#### Step 3.1: Create Admin Helper Functions

```typescript
// utils/auth-helpers/admin.ts
export async function isPlatformAdmin(email: string): Promise<boolean> {
  const ADMIN_EMAILS = [
    'admin@m10djcompany.com',
    'manager@m10djcompany.com',
    'djbenmurray@gmail.com'
  ];
  return ADMIN_EMAILS.includes(email);
}

export async function requirePlatformAdmin(user: User) {
  if (!await isPlatformAdmin(user.email || '')) {
    throw new Error('Platform admin access required');
  }
}
```

#### Step 3.2: Separate Admin Routes

**Admin Routes** (Platform-wide access):
- `/admin/dashboard` - All organizations overview
- `/admin/contacts` - All contacts across all orgs
- `/admin/analytics` - Platform-wide analytics
- `/admin/settings` - Platform settings

**SaaS Routes** (Organization-scoped):
- `/onboarding/welcome` - User's organization
- `/admin/crowd-requests` - User's organization requests
- All other routes should be org-scoped

#### Step 3.3: Update Route Protection

```typescript
// middleware or route handler
export async function requireAuth(req, res) {
  const user = await getAuthenticatedUser(req);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const isAdmin = await isPlatformAdmin(user.email);
  const orgId = isAdmin ? null : await requireOrganization(supabase, user.id);
  
  return { user, isAdmin, orgId };
}
```

### Phase 4: RLS Policy Updates (CRITICAL)

#### Step 4.1: Create Standard RLS Policies

For each tenant-scoped table:

```sql
-- Policy: SaaS users see only their organization's data
CREATE POLICY "organization_isolation" ON table_name
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()  -- Platform admin bypass
  );
```

#### Step 4.2: Update Existing Policies

Review and update all existing RLS policies to use `organization_id` instead of `user_id`.

### Phase 5: Data Migration (HIGH PRIORITY)

#### Step 5.1: Backfill Existing Data

For tables that already have data:
1. Create a default "Platform" organization
2. Assign all existing data to this organization
3. Or, create organization for each existing user

#### Step 5.2: Validate Data Integrity

After migrations:
1. Verify all records have `organization_id`
2. Verify RLS policies work correctly
3. Test admin vs SaaS user access

### Phase 6: Testing & Validation (CRITICAL)

#### Step 6.1: Security Testing

1. **Data Isolation Test:**
   - Create two SaaS organizations
   - Verify Org A cannot see Org B's data
   - Verify admin can see both

2. **RLS Test:**
   - Direct database queries should respect RLS
   - API routes should respect organization boundaries

3. **Admin Access Test:**
   - Admin can access all data
   - Admin can manage all organizations
   - SaaS users cannot access other orgs

#### Step 6.2: Functional Testing

1. Test all API routes with organization filtering
2. Test data creation with organization context
3. Test admin dashboard with multi-org data
4. Test SaaS user dashboard with single org data

## Migration Checklist

### Database Migrations Needed:

- [ ] Add `organization_id` to `payments`
- [ ] Add `organization_id` to `invoices`
- [ ] Add `organization_id` to `contracts`
- [ ] Add `organization_id` to `payment_plans`
- [ ] Add `organization_id` to `payment_installments`
- [ ] Add `organization_id` to `contact_submissions`
- [ ] Verify `contacts` has `organization_id` (migration exists)
- [ ] Verify `events` has `organization_id` (migration exists)
- [ ] Add `organization_id` to `sms_conversations`
- [ ] Add `organization_id` to `email_messages`
- [ ] Add `organization_id` to `quote_selections`
- [ ] Add `organization_id` to `service_selections`
- [ ] Add `organization_id` to `testimonials`
- [ ] Add `organization_id` to `faqs`
- [ ] Add `organization_id` to `preferred_vendors`
- [ ] Add `organization_id` to `preferred_venues`
- [ ] Add `organization_id` to `services`
- [ ] Add `organization_id` to `gallery_images`
- [ ] Add `organization_id` to `discount_codes`
- [ ] Add `organization_id` to `automation_queue`
- [ ] Add `organization_id` to `automation_templates`

### API Routes to Update:

- [ ] `/api/get-contacts.js` - Add org filtering
- [ ] `/api/get-contact-projects.js` - Add org filtering
- [ ] `/api/contact.js` - Set org_id on creation
- [ ] `/api/contacts/*` - All routes
- [ ] `/api/invoices/*` - All routes
- [ ] `/api/payments.js` - Add org filtering
- [ ] `/api/contracts/*` - All routes
- [ ] `/api/quote/*` - All routes
- [ ] `/api/service-selection/*` - All routes
- [ ] `/api/automation/*` - All routes
- [ ] `/api/followups/*` - All routes
- [ ] `/api/get-sms-logs.js` - Add org filtering
- [ ] `/api/admin/notification-logs.js` - Add org filtering (or admin-only)

### RLS Policies to Create/Update:

- [ ] Create `is_platform_admin()` function
- [ ] Update `contacts` RLS policies
- [ ] Update `events` RLS policies
- [ ] Create RLS for `payments`
- [ ] Create RLS for `invoices`
- [ ] Create RLS for `contracts`
- [ ] Create RLS for all other tenant-scoped tables

### Admin Separation:

- [ ] Create `isPlatformAdmin()` helper
- [ ] Create `requirePlatformAdmin()` helper
- [ ] Update all admin route checks
- [ ] Separate admin routes from SaaS routes
- [ ] Update middleware/route protection

## Risk Assessment

### Critical Risks:
1. **Data Leakage** - SaaS users could see other organizations' data
2. **Financial Data Exposure** - Payments, invoices, contracts not isolated
3. **RLS Bypass** - Direct database access could expose data
4. **Admin Access Confusion** - Mixed admin/SaaS logic could cause errors

### Mitigation:
1. Implement all database migrations immediately
2. Update all API routes with organization filtering
3. Test RLS policies thoroughly
4. Create clear separation between admin and SaaS routes
5. Add comprehensive logging for data access

## Next Steps

1. **IMMEDIATE**: Create migrations for critical tables (payments, invoices, contracts)
2. **IMMEDIATE**: Update API routes for data creation to set `organization_id`
3. **HIGH**: Update all read API routes to filter by organization
4. **HIGH**: Create/update RLS policies
5. **MEDIUM**: Separate admin routes from SaaS routes
6. **MEDIUM**: Add comprehensive testing

## Estimated Effort

- Database Migrations: 2-3 days
- API Route Updates: 3-4 days
- RLS Policy Updates: 1-2 days
- Admin Separation: 1-2 days
- Testing & Validation: 2-3 days

**Total: 9-14 days of focused development**


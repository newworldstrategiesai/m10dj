# 🎯 Next Steps - SaaS Launch Progress

## ✅ Completed

1. **User Management** ✅
   - Organization members table
   - Permission system
   - Team management API routes
   - Updated organization helpers

2. **Data Isolation (In Progress)** ⏳
   - Migration file created: `20251205000000_add_organization_id_to_all_tables.sql`
   - Adds `organization_id` to all tables

---

## 🔴 Critical Next Steps (Priority Order)

### 1. Complete RLS Policies (Week 1 - Day 3-4) 🔴 HIGHEST PRIORITY

**Status:** Migration adds `organization_id` but may not have complete RLS policies

**Action Required:**
1. Review the migration file to ensure all tables have RLS policies
2. Create standardized RLS policies for all tables with `organization_id`
3. Test data isolation between organizations

**Files to Check:**
- `supabase/migrations/20251205000000_add_organization_id_to_all_tables.sql`

**Standard RLS Pattern Needed:**
```sql
-- For each table with organization_id
CREATE POLICY "organization_isolation" ON table_name
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR is_platform_admin()
  );
```

### 2. Secure API Routes (Week 1 - Day 5) 🔴 HIGH PRIORITY

**Status:** Some routes secured (get-contacts.js, get-contact-projects.js), many still need updates

**Routes That Need Organization Filtering:**

**CRITICAL - Financial:**
- `/api/payments.js` - Must filter by organization
- `/api/invoices/*` - All invoice routes
- `/api/contracts/*` - All contract routes
- `/api/payment-plans/*` - Payment plan routes

**HIGH - Communication:**
- `/api/get-sms-logs.js` - Needs org filtering
- `/api/sms/*` - All SMS routes
- `/api/email/*` - All email routes
- `/api/messenger/*` - Messenger routes

**HIGH - Features:**
- `/api/crowd-request/*` - Verify all routes filter by org
- `/api/quote/*` - All quote routes
- `/api/service-selection/*` - Service selection routes
- `/api/automation/*` - Automation routes
- `/api/followups/*` - Follow-up routes

**Pattern to Use:**
```typescript
import { getOrganizationContext } from '@/utils/organization-helpers';
import { getUserRole } from '@/utils/permissions';

export default async function handler(req, res) {
  const supabase = createServerSupabaseClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Get organization context (supports team members now)
  const orgId = await getOrganizationContext(
    supabase,
    user.id,
    user.email
  );
  
  // For SaaS users, filter by organization
  let query = supabase.from('table_name').select('*');
  
  if (orgId) {
    query = query.eq('organization_id', orgId);
  } else if (!isPlatformAdmin(user.email)) {
    // SaaS user without org - deny access
    return res.status(403).json({ error: 'No organization found' });
  }
  
  // ... rest of handler
}
```

### 3. Subscription Enforcement (Week 3) 🟡 NEXT WEEK

**Status:** Not started

**What to Build:**
- Feature gating system
- Usage tracking
- Tier limit enforcement
- Upgrade prompts

**Files to Create:**
- `utils/subscription-helpers.ts`
- Update API routes with feature checks
- Add usage tracking to organizations table

---

## 📋 Immediate Action Items

### This Week (Complete Week 1):

1. **Review & Complete RLS Policies** (2-3 hours)
   - [ ] Check migration file has RLS for all tables
   - [ ] Add missing RLS policies
   - [ ] Test data isolation

2. **Secure Critical API Routes** (4-6 hours)
   - [ ] Financial routes (payments, invoices, contracts)
   - [ ] Communication routes (SMS, email)
   - [ ] Core feature routes (quotes, service selection)

3. **Test Data Isolation** (1-2 hours)
   - [ ] Create test organizations
   - [ ] Verify Org A can't see Org B data
   - [ ] Verify team members see correct data

### Next Week (Week 3):

4. **Subscription Enforcement** (3-4 days)
   - [ ] Create subscription helpers
   - [ ] Add feature gates
   - [ ] Implement usage tracking
   - [ ] Add upgrade prompts

---

## 🎯 Recommended Next Step

**Start with: Complete RLS Policies**

Since you have the migration file open, the logical next step is to:

1. **Review the migration file** to ensure all tables have proper RLS policies
2. **Add missing RLS policies** using the standard pattern
3. **Test the policies** to ensure data isolation works

This is critical for security and must be done before moving to subscription enforcement.

---

## 📊 Progress Tracking

| Task | Status | Priority |
|------|--------|----------|
| User Management | ✅ Complete | - |
| Add organization_id to tables | ⏳ In Progress | 🔴 Critical |
| RLS Policies | ⏳ Pending | 🔴 Critical |
| Secure API Routes | ⏳ Partial | 🔴 Critical |
| Subscription Enforcement | ⏳ Not Started | 🟡 High |
| White-Label | ⏳ Not Started | 🟢 Medium |

---

## 🚀 Quick Start

**To complete RLS policies right now:**

1. Open the migration file
2. Check if each table has a policy like:
   ```sql
   CREATE POLICY "organization_isolation" ON table_name...
   ```
3. If missing, add the standard policy pattern
4. Test with two organizations

**To secure API routes:**

1. Pick one route (e.g., `/api/payments.js`)
2. Add organization filtering using the pattern above
3. Test it works
4. Repeat for other routes

---

**Current Status:** Week 1 (Data Isolation) - 60% Complete  
**Next Milestone:** Complete RLS policies and secure API routes  
**Target:** Finish Week 1 by end of this week


# 🎯 Immediate Action Steps - Get SaaS Off the Ground

**Current Status:** 70% Complete  
**Time to Launch:** 2-3 weeks with focused effort

---

## ✅ What's Already Done (Great Progress!)

1. ✅ **Database Schema** - Complete
   - Organizations table
   - Organization members table
   - All tables have `organization_id`
   - RLS policies support team members

2. ✅ **User Management** - Complete
   - Team members system
   - Permission system
   - Team management APIs

3. ✅ **Core API Routes Secured** - Most done!
   - Financial routes (payments, invoices, contracts) ✅
   - Contact routes ✅
   - SMS logs ✅

---

## 🔴 CRITICAL: Do These First (This Week)

### 1. Verify Remaining API Routes (4-6 hours)

**Action:** Check these routes for organization filtering:

```bash
# Quick check script - run this to find routes missing org filtering
grep -r "getOrganizationContext\|organization_id" pages/api/ | grep -v "node_modules"
```

**Routes to Verify:**
- [ ] `/api/invoices/*` - All invoice routes (list, create, update)
- [ ] `/api/contracts/*` - All contract routes (list, create, update)
- [ ] `/api/crowd-request/submit.js` - Verify org_id set on creation
- [ ] `/api/crowd-request/*` - All crowd request routes
- [ ] `/api/quote/*` - All quote routes
- [ ] `/api/service-selection/*` - Service selection routes
- [ ] `/api/automation/*` - Automation routes
- [ ] `/api/followups/*` - Follow-up routes

**Pattern to Add (if missing):**
```typescript
import { getOrganizationContext } from '@/utils/organization-helpers';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

const orgId = await getOrganizationContext(supabase, user.id, user.email);
if (!isAdmin && orgId) {
  query = query.eq('organization_id', orgId);
}
```

---

### 2. Build Subscription Enforcement (6-8 hours)

**This is the BIGGEST gap preventing launch.**

#### Step 1: Create Subscription Helpers (2-3 hours)

Create `utils/subscription-helpers.ts`:

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

export async function checkFeatureAccess(
  supabase: SupabaseClient,
  organizationId: string,
  feature: 'unlimited_events' | 'sms' | 'automation' | 'white_label'
): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: SubscriptionTier }> {
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_tier, subscription_status')
    .eq('id', organizationId)
    .single();
  
  if (!org || org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
    return { allowed: false, reason: 'Subscription not active' };
  }
  
  const tierFeatures = {
    starter: [],
    professional: ['unlimited_events', 'sms', 'automation'],
    enterprise: ['unlimited_events', 'sms', 'automation', 'white_label']
  };
  
  if (tierFeatures[org.subscription_tier]?.includes(feature)) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: `Feature requires ${feature === 'white_label' ? 'enterprise' : 'professional'} tier`,
    upgradeRequired: feature === 'white_label' ? 'enterprise' : 'professional'
  };
}

export async function checkUsageLimit(
  supabase: SupabaseClient,
  organizationId: string,
  resource: 'events'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_tier')
    .eq('id', organizationId)
    .single();
  
  if (org?.subscription_tier !== 'starter') {
    return { allowed: true, current: 0, limit: -1 }; // Unlimited
  }
  
  // Count events this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { count } = await supabase
    .from('crowd_requests')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', startOfMonth.toISOString());
  
  const current = count || 0;
  const limit = 5; // Starter: 5 events/month
  
  return {
    allowed: current < limit,
    current,
    limit
  };
}
```

#### Step 2: Add Usage Tracking (1 hour)

Add to organizations table:
```sql
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS usage_events_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_reset_date TIMESTAMPTZ;
```

#### Step 3: Gate Event Creation (2 hours)

Update `/api/crowd-request/submit.js`:

```typescript
import { checkUsageLimit } from '@/utils/subscription-helpers';

// Before creating event
const usage = await checkUsageLimit(supabase, organizationId, 'events');
if (!usage.allowed) {
  return res.status(403).json({
    error: 'Event limit reached',
    current: usage.current,
    limit: usage.limit,
    upgradeRequired: true
  });
}
```

#### Step 4: Gate SMS Features (1 hour)

Update SMS routes to check feature access:
```typescript
import { checkFeatureAccess } from '@/utils/subscription-helpers';

const featureCheck = await checkFeatureAccess(supabase, organizationId, 'sms');
if (!featureCheck.allowed) {
  return res.status(403).json({
    error: featureCheck.reason,
    upgradeRequired: featureCheck.upgradeRequired
  });
}
```

---

### 3. Test Data Isolation (2-3 hours)

**Create test script:** `scripts/test-data-isolation.js`

```javascript
// Test data isolation between organizations
// 1. Create 2 test organizations
// 2. Create data in Org A
// 3. Try to access from Org B (should fail)
// 4. Verify platform admin can see both
```

**Tests to Run:**
- [ ] Org A can't see Org B contacts
- [ ] Org A can't see Org B events
- [ ] Org A can't see Org B payments
- [ ] Team member sees only their org's data
- [ ] Platform admin sees all data

---

## 📋 This Week's Schedule

### Monday (4-6 hours)
1. Verify remaining API routes
2. Fix any missing org filtering
3. Test data isolation

### Tuesday (6-8 hours)
4. Create subscription helpers
5. Add usage tracking
6. Gate event creation

### Wednesday (4-6 hours)
7. Gate SMS features
8. Gate automation features
9. Add upgrade prompts to UI

### Thursday (2-3 hours)
10. Comprehensive testing
11. Fix any issues found
12. Security review

### Friday (2-3 hours)
13. Performance check
14. Documentation
15. Plan next week

**Total: ~20 hours (2.5 days of focused work)**

---

## 🎯 Success Metrics

### This Week:
- ✅ All API routes verified/secured
- ✅ Subscription enforcement working
- ✅ Data isolation verified
- ✅ Feature gating in place

### Next Week:
- ✅ White-label complete
- ✅ Performance optimized
- ✅ Ready for beta launch

---

## 🚀 Quick Start Commands

```bash
# 1. Find routes missing org filtering
grep -r "from('" pages/api/ | grep -v "getOrganizationContext" | head -20

# 2. Test data isolation (after creating test script)
node scripts/test-data-isolation.js

# 3. Check subscription status
# Run in Supabase SQL editor:
SELECT id, name, subscription_tier, subscription_status FROM organizations;
```

---

## 📞 Need Help?

**Review these files:**
- `SAAS_LAUNCH_AUDIT_2025.md` - Full audit
- `LAUNCH_READINESS_CHECKLIST.md` - Detailed checklist
- `USER_MANAGEMENT_IMPLEMENTATION.md` - Team management docs

**Current Status:** 70% → Target: 85%+ for launch  
**Estimated Time:** 2-3 weeks  
**Priority:** Subscription enforcement is the blocker

---

**Last Updated:** January 2025  
**Next Review:** After subscription enforcement complete

